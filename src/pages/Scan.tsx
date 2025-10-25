import React, { useCallback, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonText, IonCard, IonCardContent
} from "@ionic/react";
import { Capacitor } from "@capacitor/core";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

const Scan: React.FC = () => {
  const [log, setLog] = useState<string>("");
  const [result, setResult] = useState<string>("");

  const append = (m: string) => setLog((p) => p + (p ? "\n" : "") + m);

  const ensurePermission = useCallback(async () => {
    const supported = await BarcodeScanner.isSupported();
    append(`isSupported: ${JSON.stringify(supported)}`);
    if (!supported.supported) throw new Error("Plugin no soportado en esta plataforma (probablemente web).");

    const check = await BarcodeScanner.checkPermissions();
    append(`checkPermissions: ${JSON.stringify(check)}`);

    if (check.camera === "granted" || check.camera === "limited" || check.camera) return;

    const req = await BarcodeScanner.requestPermissions();
    append(`requestPermissions: ${JSON.stringify(req)}`);

    const cam = req.camera;
    if (!(cam === "granted" || cam === "limited" || cam)) {
      throw new Error("Permiso de cámara NO concedido.");
    }
  }, []);

  const scan = useCallback(async () => {
    setLog("");
    setResult("");

    append(`platform: ${Capacitor.getPlatform()}`);
    try {
      await ensurePermission();

      // No filtremos el formato para no perder lecturas
      const { barcodes } = await BarcodeScanner.scan({});
      append(`barcodes.length=${barcodes.length}`);

      if (barcodes.length === 0) {
        setResult("No se detectó ningún código.");
        return;
      }

      const b = barcodes[0];
      // rawValue es el contenido legible; mostramos todo para depurar
      setResult(b.rawValue ?? "");
      append("barcode JSON:\n" + JSON.stringify(b, null, 2));
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setResult(msg);
      append("error: " + msg);
    }
  }, [ensurePermission]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>QR Scanner</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton expand="block" onClick={scan}>Escanear</IonButton>

        {result ? (
          <IonCard className="ion-margin-top">
            <IonCardContent>
              <IonText>
                <h2>Contenido</h2>
                <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{result}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : null}

        {log ? (
          <IonCard className="ion-margin-top">
            <IonCardContent>
              <IonText color="medium">
                <h3>Debug</h3>
                <pre style={{ whiteSpace: "pre-wrap" }}>{log}</pre>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : null}
      </IonContent>
    </IonPage>
  );
};

export default Scan;
