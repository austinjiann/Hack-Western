CREATE OR REPLACE FUNCTION public.sub_user_credits(
  p_user_id uuid,
  p_credit_change numeric
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance numeric;
BEGIN
  -- lock user row to avoid race conditions
  SELECT credits
    INTO v_balance
    FROM public.profiles
   WHERE profiles.user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found: user % does not exist', p_user_id;
  END IF;

  v_balance := COALESCE(v_balance, 0) - p_credit_change;

  IF v_balance < 0 THEN
    RAISE EXCEPTION 'insufficient_credits: cannot apply change % to user %, not enough credits',
      p_credit_change, p_user_id;
  END IF;

  UPDATE public.profiles
    SET credits = v_balance
   WHERE user_id = p_user_id;

  RETURN v_balance;
END;
$$;

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (
      new.id
    );
    RETURN new;
END;

-- trigger to create profile on new user creation
$$ LANGUAGE plpgsql security definer;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();