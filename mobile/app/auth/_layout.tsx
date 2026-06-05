import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="account-verification" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="splash-auth" />
       <Stack.Screen name="study-plan" />
        <Stack.Screen name="level-category" />
         <Stack.Screen name="add-password" />
         <Stack.Screen name="upload-video" />
    </Stack>
  );
}