
# Script de déploiement automatique pour GIM

Write-Host "=== Déploiement GIM vers GitHub ===" -ForegroundColor Cyan

# Vérifier si une remote existe déjà
$remote = git remote get-url origin 2>$null

if (-not $remote) {
    Write-Host "Aucun dépôt distant (remote) n'est configuré." -ForegroundColor Yellow
    $repoUrl = Read-Host "Entrez l'URL de votre dépôt GitHub (ex: https://github.com/votre-user/Gestionnaire-inspections-municipales.git)"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "Remote 'origin' ajouté." -ForegroundColor Green
    }
    else {
        Write-Host "URL invalide. Annulation." -ForegroundColor Red
        exit
    }
}
else {
    Write-Host "Dépôt distant détecté : $remote" -ForegroundColor Green
}

# Push du code source
Write-Host "Push du code sur la branche main..." -ForegroundColor Cyan
git push -u origin main

if ($?) {
    Write-Host "Code source poussé avec succès." -ForegroundColor Green
}
else {
    Write-Host "Erreur lors du push. Vérifiez vos permissions." -ForegroundColor Red
    exit
}

# Déploiement sur GitHub Pages
Write-Host "Déploiement sur GitHub Pages..." -ForegroundColor Cyan
npm run deploy

if ($?) {
    Write-Host "Déploiement terminé ! Votre site sera bientôt accessible." -ForegroundColor Green
    Write-Host "N'oubliez pas d'activer GitHub Pages sur la branche 'gh-pages' dans les paramètres du dépôt." -ForegroundColor Yellow
}
else {
    Write-Host "Erreur lors du déploiement." -ForegroundColor Red
}

Write-Host "Déploiement terminé." -ForegroundColor Green
Write-Host "NOTE : La version en ligne ne peut pas se connecter au serveur local (Mixed Content)." -ForegroundColor Yellow
Write-Host "Pour utiliser l'application, veuillez lancer : .\LANCER_APP.bat" -ForegroundColor Cyan

Pause
