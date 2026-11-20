// Barkod okuma: kamera (EAN-13/8, UPC) + galeriden barkod fotoğrafı + elle giriş
import { useCallback, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ErrorText, Field, H1, Muted, Screen, T, Row } from '../components/ui';
import { colors } from '../theme';

const TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'];

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');
  const [torch, setTorch] = useState(false);
  const locked = useRef(false);
  const focused = useIsFocused();

  // Ekrana her dönüldüğünde tarayıcı yeniden açılır
  useFocusEffect(useCallback(() => { locked.current = false; setError(''); }, []));

  const open = (code) => {
    const clean = String(code).replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(clean)) { setError('Barkod 8–14 haneli bir sayı olmalı.'); locked.current = false; return; }
    navigation.navigate('ScanResult', { barcode: clean });
  };

  const onScanned = ({ data }) => {
    if (locked.current) return; // aynı barkod saniyede onlarca kez okunur; yalnızca ilkini işle
    locked.current = true;
    open(data);
  };

  const fromGallery = async () => {
    setError('');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (r.canceled) return;
    try {
      const found = await scanFromURLAsync(r.assets[0].uri, TYPES);
      if (!found.length) return setError('Fotoğrafta barkod bulunamadı. Daha net bir fotoğraf deneyin.');
      open(found[0].data);
    } catch {
      setError('Fotoğraftan barkod okunamadı.');
    }
  };

  if (!permission) return <Screen><Muted>Kamera hazırlanıyor…</Muted></Screen>;

  if (!permission.granted) {
    return (
      <Screen>
        <H1>Barkod Okut</H1>
        <Card>
          <T size={18} style={{ marginBottom: 12 }}>Ürün barkodunu okutmak için kameranıza izin vermeniz gerekiyor.</T>
          {permission.canAskAgain
            ? <Button title="Kameraya izin ver" icon="📷" onPress={requestPermission} />
            : <Button title="Ayarları aç" onPress={() => Linking.openSettings()} />}
        </Card>
        <ManualEntry manual={manual} setManual={setManual} open={open} fromGallery={fromGallery} error={error} />
      </Screen>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flex: 1 }}>
        {focused && (
          <CameraView style={StyleSheet.absoluteFill} facing="back" enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: TYPES }} onBarcodeScanned={onScanned} />
        )}
        <View style={st.overlay} pointerEvents="box-none">
          <T size={22} weight="800" color="#fff" style={st.shadow}>Barkodu çerçeveye getirin</T>
          <View style={st.frame}><View style={st.laser} /></View>
          <T size={16} color="#fff" style={[st.shadow, { textAlign: 'center' }]}>Ürünün diyetinize uygun olup olmadığını hemen kontrol edeceğiz.</T>
          <Row style={{ marginTop: 14 }}>
            <Button small variant="secondary" title={torch ? 'Işığı kapat' : 'Işık'} icon="🔦" onPress={() => setTorch(!torch)} />
            <Button small variant="secondary" title="Geçmiş" icon="🕘" onPress={() => navigation.navigate('ScanHistory')} />
          </Row>
        </View>
      </View>
      <View style={st.bottom}>
        <ManualEntry manual={manual} setManual={setManual} open={open} fromGallery={fromGallery} error={error} compact />
      </View>
    </SafeAreaView>
  );
}

function ManualEntry({ manual, setManual, open, fromGallery, error, compact }) {
  return (
    <View>
      <ErrorText>{error}</ErrorText>
      <Row>
        <Field style={{ flex: 1, marginBottom: 0 }} placeholder="Barkodu elle yazın" keyboardType="number-pad" value={manual}
          onChangeText={setManual} onSubmitEditing={() => open(manual)} returnKeyType="search" maxLength={14} />
        <Button small title="Kontrol et" onPress={() => open(manual)} disabled={manual.length < 8} />
      </Row>
      {!compact && <Button variant="secondary" title="Galeriden barkod fotoğrafı seç" icon="🖼️" onPress={fromGallery} />}
      {compact && <Button small variant="ghost" title="Galeriden barkod fotoğrafı seç" onPress={fromGallery} />}
    </View>
  );
}

const st = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24 },
  frame: { width: '88%', aspectRatio: 1.9, borderWidth: 4, borderColor: '#fff', borderRadius: 18, marginVertical: 18, justifyContent: 'center' },
  laser: { height: 3, backgroundColor: '#FF5A4E', marginHorizontal: 12, opacity: 0.85 },
  shadow: { textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 6 },
  bottom: { backgroundColor: colors.bg, padding: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
});
