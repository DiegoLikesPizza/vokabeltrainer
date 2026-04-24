#!/bin/bash

# Vokabeltrainer - Auto Deployment Script
echo "🚀 Starte Deployment..."

# 1. Code aktualisieren
echo "📥 Ziehe neuesten Code von Git..."
git pull

# 2. Abhängigkeiten installieren
echo "📦 Installiere Abhängigkeiten..."
npm install

# 3. App bauen
echo "🏗️ Baue die Anwendung (Production Build)..."
npm run build

# 4. Berechtigungen reparieren
echo "🔐 Setze Dateiberechtigungen..."
sudo chown -R www-data:www-data .
sudo chmod -R +x node_modules/.bin

# 5. App neu starten
if command -v pm2 &> /dev/null
then
    echo "🔄 Starte App mit PM2 neu..."
    pm2 restart vokabeltrainer || pm2 start npm --name "vokabeltrainer" -- start
else
    echo "⚠️ PM2 nicht gefunden. Bitte starte die App manuell mit 'npm start' neu."
fi

echo "✅ Deployment erfolgreich abgeschlossen!"
