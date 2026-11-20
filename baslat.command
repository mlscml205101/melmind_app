#!/bin/bash
# MelMind: MySQL + API Docker'da, ardından Expo (QR kodu bu pencerede çıkar)
cd "$(dirname "$0")"
ROOT="$(pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"
dur() { echo; echo "HATA: $1"; read -p "Kapatmak için Enter..."; exit 1; }

echo "== 1/4 Docker kontrol ediliyor =="
if ! docker info >/dev/null 2>&1; then
  open -a Docker
  echo "Docker Desktop açılıyor..."
  for i in $(seq 1 90); do docker info >/dev/null 2>&1 && break; sleep 2; done
  docker info >/dev/null 2>&1 || dur "Docker açılamadı. Docker Desktop'ı elle açıp bu dosyayı tekrar çalıştırın."
fi

# Eski (Docker dışı) sunucu açık kaldıysa kapat — 4000 portu boşalsın
pkill -f "node --watch src/index.js" 2>/dev/null
pkill -f "node src/index.js" 2>/dev/null

echo "== 2/4 Veritabanı ve sunucu Docker'da başlatılıyor =="
docker compose up -d --build || dur "docker compose başarısız oldu."
echo "Sunucunun açılması bekleniyor..."
for i in $(seq 1 90); do curl -s -o /dev/null http://localhost:4000/demo-barkodlar && break; sleep 2; done
curl -s -o /dev/null http://localhost:4000/demo-barkodlar || { docker compose logs --tail 40 server; dur "Sunucu açılmadı (loglar yukarıda)."; }
echo "✓ Sunucu hazır: http://localhost:4000"

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
[ -n "$IP" ] || dur "Wi-Fi IP adresi bulunamadı. Wi-Fi'ye bağlı olduğunuzdan emin olun."
echo "EXPO_PUBLIC_API_URL=http://$IP:4000" > "$ROOT/mobile/.env"
echo "✓ Telefon bu adresten bağlanacak: http://$IP:4000"

echo "== 3/4 Mobil paketler kontrol ediliyor =="
cd "$ROOT/mobile"
# iCloud bazen node_modules dosyalarını Mac'ten siler; bozuksa yeniden kur
saglam() {
  [ -f node_modules/.melmind_ok ] || return 1
  for f in node_modules/expo/package.json node_modules/react-native/package.json node_modules/metro/package.json; do
    perl -e 'alarm 5; open(F, $ARGV[0]) or exit 1; read(F, $b, 1); exit 0' "$f" || return 1
  done
}
if ! saglam; then
  echo "Mobil paketler eksik/bozuk, yeniden kuruluyor..."
  [ -e node_modules ] && mkdir -p "$ROOT/_to_delete" && mv node_modules "$ROOT/_to_delete/mobile_node_modules_$(date +%s)"
  npm install && touch node_modules/.melmind_ok || dur "npm install başarısız oldu."
fi

echo "== 4/4 Expo başlıyor — QR kodu telefonla okutun (aynı Wi-Fi) =="
npx expo start -c
