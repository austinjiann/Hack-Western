import { useEffect, useState, useCallback } from "react";
import { get, set } from "idb-keyval";

export interface SceneEntity {
  id: string;
  description: string;
  appearance: string;
}

export interface SceneState {
  style: string;
  environment: string;
  entities: SceneEntity[];
}

export interface ClipMeta {
  index: number;
  clipUrl: string;
  lastFrameUrl: string;
  annotations: any;
  prompt: string;
  modelParams?: any;
}

export interface ProjectContext {
  projectId: string;
  dimensions: { width: number; height: number };
  clips: ClipMeta[];
  sceneState: SceneState;
}

export function useGlobalContext(projectId: string) {
  const [context, setContext] = useState<ProjectContext | null>(null);

  // Load once from IndexedDB
  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await get(projectId);
      if (mounted) setContext(stored || null);
    })();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Initialize new project
  const initProject = useCallback(
    async (dimensions: { width: number; height: number }) => {
      const ctx: ProjectContext = {
        projectId,
        dimensions,
        clips: [],
        sceneState: {
          style: "",
          environment: "",
          entities: [],
        },
      };
      await set(projectId, ctx); // persist new project
      setContext(ctx);
    },
    [projectId],
  );

  // Add a generated clip
  const addClip = useCallback(
    async (clip: ClipMeta) => {
      if (!context) return;
      const updated = { ...context, clips: [...context.clips, clip] };
      await set(projectId, updated); // persist clip update
      setContext(updated);
    },
    [context, projectId],
  );

  // Update scene continuity state
  const updateSceneState = useCallback(
    async (partial: Partial<SceneState>) => {
      if (!context) return;
      const sceneState = { ...context.sceneState, ...partial };
      const updated = { ...context, sceneState };
      await set(projectId, updated); // persist scene state update
      setContext(updated);
    },
    [context, projectId],
  );

  return {
    context,
    initProject,
    addClip,
    updateSceneState,
  };
}
