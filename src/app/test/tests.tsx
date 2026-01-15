import { useState } from "react";
import { Image, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { FirebaseDiagnostics } from "@/src/api/test/firebase-diagnostics";
import { TestNotifications } from "@/src/api/test/test-notifications";
import { TestUpdateUser } from "@/src/api/test/test-update-user-image";
import { Button, ButtonText } from "@/src/components/ui/button";
import { VStack } from "@/src/components/ui/vstack";

export default function TestsScreen() {

  const [diagnosticResult, setDiagnosticResult] = useState<string>("");
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setDiagnosticResult("Running diagnostics...");
    let log = "";

    const authStatus = await FirebaseDiagnostics.checkAuth();
    log += `[Auth] ${JSON.stringify(authStatus, null, 2)}\n\n`;

    const sportsRead = await FirebaseDiagnostics.checkFirestoreRead("sports");
    log += `[Read 'sports'] ${
      sportsRead.success ? "✅ OK" : "❌ FAIL: " + sportsRead.error
    }\n`;

    const sportsWrite = await FirebaseDiagnostics.checkFirestoreWrite(
      "sports"
    );
    log += `[Write 'sports'] ${
      sportsWrite.success ? "✅ OK" : "❌ FAIL: " + sportsWrite.error
    }\n`;

    const fnCheck = await FirebaseDiagnostics.checkCloudFunction("sports_get");
    log += `[Function 'sports_get'] ${
      fnCheck.success ? "✅ OK" : "❌ FAIL: " + fnCheck.error
    }\n`;

    setDiagnosticResult(log);
    console.log("[DIAGNOSTICS FINAL LOG]:\n", log);
  };

  const runUpdateTest = async () => {
    setDiagnosticResult((prev) => prev + "\n\nRunning Update Profile Test...");
    const result = await TestUpdateUser.updateProfile();
    const msg = `[Update Profile] ${
      result.success ? "✅ Success" : "❌ Failed: " + result.error
    }`;
    console.log(msg);
    setDiagnosticResult((prev) => prev + "\n" + msg);
  };

  const runImageUploadTest = async () => {
    setDiagnosticResult((prev) => prev + "\n\nRunning Image Upload Test...");
    try {
      const blob = await TestUpdateUser.createDummyImage();
      const result = await TestUpdateUser.uploadImageClientSide(blob);
      const msg = `[Upload Image] ${
        result.success
          ? "✅ Success: " + result.url
          : "❌ Failed: " + result.error
      }`;
      console.log(msg);
      setDiagnosticResult((prev) => prev + "\n" + msg);
    } catch (e: any) {
      const msg = `[Upload Image] ❌ Failed to create dummy blob: ${e.message}`;
      console.log(msg);
      setDiagnosticResult((prev) => prev + "\n" + msg);
    }
  };

  const runGetImageTest = async () => {
    setDiagnosticResult((prev) => prev + "\n\nRunning Get Image Test...");
    setTestImageUrl(null);
    const result = await TestUpdateUser.getTestImage();

    if (result.success && result.url) {
      const msg = `[Get Image] ✅ Success: URL obtained`;
      console.log(msg, result.url);
      setDiagnosticResult((prev) => prev + "\n" + msg);
      setTestImageUrl(result.url);
    } else {
      const msg = `[Get Image] ❌ Failed: ${result.error}`;
      console.log(msg);
      setDiagnosticResult((prev) => prev + "\n" + msg);
    }
  };

  const runNotificationTest = async () => {
    setDiagnosticResult((prev) => prev + "\n\nRunning Notification Test...");
    const result = await TestNotifications.sendTestPush();
    const msg = `[Notification Test] ${
      result.success
        ? `✅ Success: Sent to ${result.count} devices`
        : "❌ Failed: " + result.error
    }`;
    console.log(msg);
    setDiagnosticResult((prev) => prev + "\n" + msg);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <VStack style={{ flex: 1, padding: 16, gap: 12 }}>
        <Button
          variant="outline"
          onPress={() => {
            router.back();
          }}
        >
          <ButtonText>Volver</ButtonText>
        </Button>

        <Button
          variant="outline"
          onPress={runUpdateTest}
          style={{ marginTop: 10, borderColor: "blue" }}
        >
          <ButtonText style={{ color: "blue" }}>
            TEST: ACTUALIZAR PERFIL (CLOUD FUNC)
          </ButtonText>
        </Button>

        <Button
          variant="outline"
          onPress={runImageUploadTest}
          style={{ marginTop: 10, borderColor: "purple" }}
        >
          <ButtonText style={{ color: "purple" }}>
            TEST: SUBIR IMAGEN (STORAGE)
          </ButtonText>
        </Button>

        <Button
          variant="outline"
          onPress={runDiagnostics}
          style={{ marginTop: 10, borderColor: "red" }}
        >
          <ButtonText style={{ color: "red" }}>
            EJECUTAR DIAGNÓSTICO COMPLETO
          </ButtonText>
        </Button>

        <Button
          variant="outline"
          onPress={runGetImageTest}
          style={{ marginTop: 10, borderColor: "green" }}
        >
          <ButtonText style={{ color: "green" }}>
            TEST: VER IMAGEN STORAGE
          </ButtonText>
        </Button>

        <Button
          variant="outline"
          onPress={runNotificationTest}
          style={{ marginTop: 10, borderColor: "orange" }}
        >
          <ButtonText style={{ color: "orange" }}>
            TEST: ENVIAR NOTIFICACIÓN PUSH
          </ButtonText>
        </Button>

        {testImageUrl && (
          <VStack style={{ marginTop: 10, alignItems: "center" }}>
            <Text>Imagen recuperada:</Text>
            <Image
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "gray",
              }}
              source={{ uri: testImageUrl }}
            />
          </VStack>
        )}

        {diagnosticResult ? (
          <ScrollView
            style={{
              height: 300,
              backgroundColor: "#f0f0f0",
              padding: 10,
              marginTop: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontFamily: "monospace", fontSize: 12 }}>
              {diagnosticResult}
            </Text>
          </ScrollView>
        ) : null}
      </VStack>
    </SafeAreaView>
  );
}
