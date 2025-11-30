import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Separator,
} from "@radix-ui/themes";
import { Check, Sparkles, Video, Loader2 } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { apiFetch } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL;
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBuyCredits = async (productId: string) => {
    if (!user) {
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }
    if (loadingProductId) return;
    setLoadingProductId(productId);

    try {
      const response = await apiFetch(`${backendUrl}/api/autumn/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });

      const result = await response.json();
      console.log("Checkout result:", result);

      if (result.url || result.checkout_url) {
        window.location.href = result.url || result.checkout_url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoadingProductId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative z-10">
        <Navbar />

        <Container size="4" className="py-20 px-4">
          <Flex
            direction="column"
            align="center"
            gap="4"
            className="mb-16 text-center"
          >
            <Heading size="8" className="font-bold tracking-tight">
              Pay as you go
            </Heading>
            <Text size="4" color="gray" className="max-w-2xl">
              Purchase credits and use them for video generation or image
              enhancement. Credits never expire.
            </Text>
            <Flex
              gap="6"
              mt="4"
              className="border border-gray-200 px-6 py-3 rounded-lg bg-white shadow-sm"
            >
              <Flex gap="2" align="center">
                <Video size={16} />
                <Text size="2" weight="medium">
                  1 Video = 10 Credits
                </Text>
              </Flex>
              <Separator orientation="vertical" size="2" />
              <Flex gap="2" align="center">
                <Sparkles size={16} />
                <Text size="2" weight="medium">
                  1 Image Enhancement = 1 Credit
                </Text>
              </Flex>
            </Flex>
          </Flex>

          <Grid
            columns={{ initial: "1", sm: "1", md: "3" }}
            gap="6"
            width="auto"
          >
            {/* Free Trial */}
            <Card size="3" className="p-6 relative overflow-hidden">
              <Flex direction="column" height="100%" gap="5">
                <Box>
                  <Heading size="4" mb="2">
                    Free Trial
                  </Heading>
                  <Flex align="baseline" gap="1">
                    <Heading size="8">50</Heading>
                    <Text color="gray">Credits</Text>
                  </Flex>
                  <Text size="2" color="gray" mt="2">
                    Enough for 5 videos or 50 image enhancements
                  </Text>
                </Box>

                <Separator size="4" />

                <Flex direction="column" gap="3" flexGrow="1">
                  <FeatureItem text="Standard quality (720p)" />
                  <FeatureItem text="Basic editing tools" />
                  <FeatureItem text="Public projects" />
                </Flex>

                <Button
                  variant="outline"
                  size="3"
                  className="w-full cursor-pointer mt-4"
                  onClick={() => handleBuyCredits("free-trial")}
                  disabled={loadingProductId !== null}
                >
                  {loadingProductId === "free-trial" ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "Start Free"
                  )}
                </Button>
              </Flex>
            </Card>

            {/* Starter Pack */}
            <Card
              size="3"
              className="p-6 relative overflow-hidden border-2 border-black"
            >
              <div className="absolute top-0 right-0 bg-black text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <Flex direction="column" height="100%" gap="5">
                <Box>
                  <Heading size="4" mb="2">
                    Starter Pack
                  </Heading>
                  <Flex align="baseline" gap="1">
                    <Heading size="8">$10</Heading>
                    <Text color="gray">/ 500 Credits</Text>
                  </Flex>
                  <Text size="2" color="gray" mt="2">
                    ~50 Videos or 500 Image Enhancements
                  </Text>
                </Box>

                <Separator size="4" />

                <Flex direction="column" gap="3" flexGrow="1">
                  <FeatureItem text="HD quality (1080p)" />
                  <FeatureItem text="Advanced AI models" />
                  <FeatureItem text="Private projects" />
                  <FeatureItem text="No watermarks" />
                </Flex>

                <Button
                  size="3"
                  className="w-full bg-black text-white hover:bg-gray-800 cursor-pointer mt-4"
                  onClick={() => handleBuyCredits("starter-pack")}
                  disabled={loadingProductId !== null}
                >
                  {loadingProductId === "starter-pack" ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "Buy 500 Credits"
                  )}
                </Button>
              </Flex>
            </Card>

            {/* Pro Pack */}
            <Card size="3" className="p-6 relative overflow-hidden">
              <Flex direction="column" height="100%" gap="5">
                <Box>
                  <Heading size="4" mb="2">
                    Pro Pack
                  </Heading>
                  <Flex align="baseline" gap="1">
                    <Heading size="8">$30</Heading>
                    <Text color="gray">/ 2000 Credits</Text>
                  </Flex>
                  <Text size="2" color="gray" mt="2">
                    ~200 Videos or 2000 Image Enhancements
                  </Text>
                </Box>

                <Separator size="4" />

                <Flex direction="column" gap="3" flexGrow="1">
                  <FeatureItem text="4K Video generation" />
                  <FeatureItem text="Team collaboration" />
                  <FeatureItem text="Custom AI fine-tuning" />
                  <FeatureItem text="Priority support" />
                </Flex>

                <Button
                  variant="outline"
                  size="3"
                  className="w-full cursor-pointer mt-4"
                  onClick={() => handleBuyCredits("pro-pack")}
                  disabled={loadingProductId !== null}
                >
                  {loadingProductId === "pro-pack" ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "Buy 2000 Credits"
                  )}
                </Button>
              </Flex>
            </Card>
          </Grid>
        </Container>

        <Footer />
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <Flex gap="2" align="center">
      <div className="bg-black/5 p-1 rounded-full">
        <Check size={14} className="text-black" />
      </div>
      <Text size="2">{text}</Text>
    </Flex>
  );
}
