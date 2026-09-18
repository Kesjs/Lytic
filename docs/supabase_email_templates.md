# Templates d'Emails Supabase pour Reflet

Voici les différents templates HTML à copier-coller dans votre tableau de bord Supabase (**Authentication > Email Templates**).

---

## 1. Confirm Signup / Magic Link / OTP

À coller dans **Confirm signup** et **Magic Link**.
*Sujet recommandé : Votre code de connexion Reflet*

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre code d'accès Reflet</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
    <tr>
      <td style="background-color: #FFFFFF; border: 1px solid #E8E5E0; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
        <!-- HEADER REFLET -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; border-bottom: 1px solid #F0EDE8; padding-bottom: 20px;">
          <tr>
            <td valign="middle">
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">
                Reflet<span style="color: #eab308;">.</span>
              </span>
              <div style="font-size: 11px; font-weight: 700; color: #ca8a04; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">
                Mesure de visibilité IA
              </div>
            </td>
            <td align="right" valign="middle">
              <span style="background-color: #fef9c3; border: 1px solid #fef08a; color: #a16207; padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">
                Sécurité
              </span>
            </td>
          </tr>
        </table>

        <!-- TITRE -->
        <h1 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 10px; line-height: 1.25;">
          Votre code de connexion
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #64635F; margin: 0 0 24px;">
          Entrez le code de vérification ci-dessous sur <strong>Reflet</strong> pour accéder en toute sécurité à vos analyses et audits d'IA :
        </p>

        <!-- CARTOUCHE DU CODE OTP -->
        <div style="background-color: #FAF9F6; border: 1px solid #E8E5E0; border-radius: 12px; padding: 22px 16px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 700; color: #64635F; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
            Code de vérification à 6 chiffres
          </div>
          <div style="font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0F172A; margin: 6px 0;">
            {{ .Token }}
          </div>
          <div style="display: inline-block; font-size: 11.5px; font-weight: 600; color: #a16207; background-color: #fef9c3; padding: 3px 12px; border-radius: 100px; margin-top: 4px;">
            Ce code expire dans 10 minutes
          </div>
        </div>

        <!-- BOUTON ACCÈS DIRECT -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #0F172A; color: #FFFFFF !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; text-align: center; letter-spacing: 0.01em;">
                Accéder directement à mes analyses &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- AVERTISSEMENT -->
        <div style="background-color: #FAF9F6; border-left: 3px solid #eab308; padding: 12px 16px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64635F;">
            Ce code est strictement personnel. Si vous n'avez pas initié cette demande sur Reflet, vous pouvez ignorer cet email en toute sécurité.
          </p>
        </div>
      </td>
    </tr>

    <!-- FOOTER REFLET -->
    <tr>
      <td style="padding: 24px 12px; text-align: center; font-size: 12px; line-height: 1.6; color: #9C9A95;">
        <p style="margin: 0 0 4px; font-weight: 700; color: #0F172A;">
          Reflet — Faites de votre marque l'unique réponse des IA.
        </p>
        <p style="margin: 0;">
          Audits IA — Analyse concurrentielle — Recommandations actionnables<br>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Reset Password (Réinitialisation de mot de passe)

À coller dans **Reset Password**.
*Sujet recommandé : Réinitialisation de votre mot de passe Reflet*

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe Reflet</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
    <tr>
      <td style="background-color: #FFFFFF; border: 1px solid #E8E5E0; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
        <!-- HEADER REFLET -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; border-bottom: 1px solid #F0EDE8; padding-bottom: 20px;">
          <tr>
            <td valign="middle">
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">
                Reflet<span style="color: #eab308;">.</span>
              </span>
              <div style="font-size: 11px; font-weight: 700; color: #ca8a04; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">
                Mesure de visibilité IA
              </div>
            </td>
            <td align="right" valign="middle">
              <span style="background-color: #fef9c3; border: 1px solid #fef08a; color: #a16207; padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">
                Sécurité
              </span>
            </td>
          </tr>
        </table>

        <!-- TITRE -->
        <h1 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 10px; line-height: 1.25;">
          Réinitialisation de mot de passe
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #64635F; margin: 0 0 24px;">
          Une demande de réinitialisation a été effectuée pour votre compte <strong>Reflet</strong>. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
        </p>

        <!-- BOUTON REINITIALISATION -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #0F172A; color: #FFFFFF !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; text-align: center; letter-spacing: 0.01em;">
                Réinitialiser mon mot de passe &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- AVERTISSEMENT -->
        <div style="background-color: #FAF9F6; border-left: 3px solid #0F172A; padding: 12px 16px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64635F;">
            Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email : vos identifiants restent inchangés.
          </p>
        </div>
      </td>
    </tr>

    <!-- FOOTER REFLET -->
    <tr>
      <td style="padding: 24px 12px; text-align: center; font-size: 12px; line-height: 1.6; color: #9C9A95;">
        <p style="margin: 0 0 4px; font-weight: 700; color: #0F172A;">
          Reflet — Faites de votre marque l'unique réponse des IA.
        </p>
        <p style="margin: 0;">
          Audits IA — Analyse concurrentielle — Recommandations actionnables<br>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Invite User (Invitation)

À coller dans **Invite User**.
*Sujet recommandé : Vous avez été invité sur Reflet*

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation à rejoindre Reflet</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
    <tr>
      <td style="background-color: #FFFFFF; border: 1px solid #E8E5E0; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
        <!-- HEADER REFLET -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; border-bottom: 1px solid #F0EDE8; padding-bottom: 20px;">
          <tr>
            <td valign="middle">
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">
                Reflet<span style="color: #eab308;">.</span>
              </span>
              <div style="font-size: 11px; font-weight: 700; color: #ca8a04; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">
                Mesure de visibilité IA
              </div>
            </td>
          </tr>
        </table>

        <!-- TITRE -->
        <h1 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 10px; line-height: 1.25;">
          Vous êtes invité(e) sur Reflet
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #64635F; margin: 0 0 24px;">
          Vous avez été invité(e) à créer un compte pour collaborer et accéder aux analyses d'intelligence artificielle sur <strong>Reflet</strong>.
        </p>

        <!-- BOUTON -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #0F172A; color: #FFFFFF !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; text-align: center; letter-spacing: 0.01em;">
                Accepter l'invitation &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- FOOTER REFLET -->
    <tr>
      <td style="padding: 24px 12px; text-align: center; font-size: 12px; line-height: 1.6; color: #9C9A95;">
        <p style="margin: 0 0 4px; font-weight: 700; color: #0F172A;">
          Reflet — Faites de votre marque l'unique réponse des IA.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address (Modification d'adresse e-mail)

À coller dans **Change Email Address**.
*Sujet recommandé : Confirmez votre nouvelle adresse e-mail*

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de changement d'e-mail</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
    <tr>
      <td style="background-color: #FFFFFF; border: 1px solid #E8E5E0; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
        <!-- HEADER REFLET -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; border-bottom: 1px solid #F0EDE8; padding-bottom: 20px;">
          <tr>
            <td valign="middle">
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">
                Reflet<span style="color: #eab308;">.</span>
              </span>
              <div style="font-size: 11px; font-weight: 700; color: #ca8a04; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">
                Mesure de visibilité IA
              </div>
            </td>
            <td align="right" valign="middle">
              <span style="background-color: #fef9c3; border: 1px solid #fef08a; color: #a16207; padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">
                Sécurité
              </span>
            </td>
          </tr>
        </table>

        <!-- TITRE -->
        <h1 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 10px; line-height: 1.25;">
          Confirmez votre nouvelle adresse
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #64635F; margin: 0 0 24px;">
          Vous avez demandé à changer l'adresse e-mail de votre compte pour <strong>{{ .NewEmail }}</strong>. Cliquez sur le lien ci-dessous pour confirmer cette modification :
        </p>

        <!-- BOUTON -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #0F172A; color: #FFFFFF !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; text-align: center; letter-spacing: 0.01em;">
                Confirmer ma nouvelle adresse e-mail &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- AVERTISSEMENT -->
        <div style="background-color: #FAF9F6; border-left: 3px solid #eab308; padding: 12px 16px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64635F;">
            Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet email en toute sécurité.
          </p>
        </div>
      </td>
    </tr>
    <!-- FOOTER REFLET -->
    <tr>
      <td style="padding: 24px 12px; text-align: center; font-size: 12px; line-height: 1.6; color: #9C9A95;">
        <p style="margin: 0 0 4px; font-weight: 700; color: #0F172A;">
          Reflet — Faites de votre marque l'unique réponse des IA.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```
