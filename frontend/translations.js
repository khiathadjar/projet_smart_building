(function () {
  var translations = {
    fr: {
      brand: "IntelliBuild",
      nav_home: "Accueil",
      nav_features: "Fonctionnalites",
      nav_about: "A propos",
      nav_documentation: "Documentation",
      nav_dashboard: "Dashboard",
      nav_add: "Ajouter",
      nav_objects: "Objets",
      nav_my_objects: "Mes objets",
      nav_locations: "Localisations",
      nav_history: "Historique",
      nav_notifications: "Notifications",
      nav_settings: "Parametres",
      btn_login: "Connexion",
      btn_register: "Inscription",
      btn_signin: "Se connecter",
      btn_signup: "S'inscrire",
      btn_refresh: "Actualiser",
      btn_back_dashboard: "Retour dashboard",
      btn_mark_all_read: "Tout marquer lu",
      btn_update_password: "Mettre a jour",
      forgot_password: "Mot de passe oublie ?",
      label_email: "Email",
      label_password: "Mot de passe",
      label_new_password: "Nouveau mot de passe",
      label_confirm_password: "Confirmer le mot de passe",
      ph_email: "exemple@mail.com",
      ph_password: "........",
      ph_confirm_password: "........",
      menu_profile: "Mon profil",
      logout: "Deconnexion",
      search_objects: "Rechercher un objet...",
      table_name: "Nom",
      table_type: "Type",
      table_location: "Localisation",
      table_status: "Statut",
      unread_label: "Non lues:",
      lang_title: "Langue",
      auth_link_login: 'Vous avez deja un compte ? <a href="login.html">Connectez-vous</a>',
      title: "Plateforme intelligente<br>de gestion d'objets connectes",
      subtitle: "Une solution moderne pour decrire, gerer, securiser et rechercher les objets connectes dans un smart building.",
      start: "Commencer",
      discover: "Decouvrir",
      feature1_title: "Gestion",
      feature1_text: "Ajouter, modifier et supprimer facilement vos objets connectes.",
      feature2_title: "Securite",
      feature2_text: "Controle d'acces, protection des donnees et surveillance intelligente.",
      feature3_title: "Recherche",
      feature3_text: "Recherche rapide par type, localisation ou etat des objets.",
      about_title: "Pourquoi IntelliBuild ?",
      about_text: "IntelliBuild centralise la gestion des objets connectes d'un batiment intelligent pour ameliorer l'efficacite, la securite et la visibilite.",
      login_doc_title: "Connexion - IntelliBuild",
      login_title: "Connexion",
      login_sub: "Accedez a votre plateforme Smart Building",
      register_doc_title: "Inscription - IntelliBuild",
      register_title: "Creer un compte",
      register_sub: "Rejoignez la plateforme IntelliBuild",
      reset_doc_title: "Reinitialiser le mot de passe - IntelliBuild",
      reset_title: "Reinitialiser le mot de passe",
      reset_sub: "Choisis un nouveau mot de passe.",
      notifications_user_title: "Notifications utilisateur",
      notifications_user_sub: "Canal personnel: vos emprunts, retours et messages utiles.",
      notifications_admin_title: "Notifications admin",
      notifications_admin_sub: "Canal reserve aux actions et alertes d'administration.",
      notifications_user_empty: "Aucune notification utilisateur pour le moment.",
      notifications_admin_empty: "Aucune notification admin pour le moment.",
      my_objects_title: "Mes objets",
      my_objects_sub: "Objets que vous avez pris et que vous pouvez rendre",
      my_objects_empty: "Vous n'avez aucun objet en cours.",
      stat_locations_suffix: "salles uniques"
    },
    en: {
      brand: "IntelliBuild",
      nav_home: "Home",
      nav_features: "Features",
      nav_about: "About",
      nav_documentation: "Documentation",
      nav_dashboard: "Dashboard",
      nav_add: "Add",
      nav_objects: "Objects",
      nav_my_objects: "My objects",
      nav_locations: "Locations",
      nav_history: "History",
      nav_notifications: "Notifications",
      nav_settings: "Settings",
      btn_login: "Login",
      btn_register: "Sign up",
      btn_signin: "Sign in",
      btn_signup: "Create account",
      btn_refresh: "Refresh",
      btn_back_dashboard: "Back to dashboard",
      btn_mark_all_read: "Mark all as read",
      btn_update_password: "Update password",
      forgot_password: "Forgot password?",
      label_email: "Email",
      label_password: "Password",
      label_new_password: "New password",
      label_confirm_password: "Confirm password",
      ph_email: "example@mail.com",
      ph_password: "........",
      ph_confirm_password: "........",
      menu_profile: "My profile",
      logout: "Sign out",
      search_objects: "Search for an object...",
      table_name: "Name",
      table_type: "Type",
      table_location: "Location",
      table_status: "Status",
      unread_label: "Unread:",
      lang_title: "Language",
      auth_link_login: 'Already have an account? <a href="login.html">Sign in</a>',
      title: "Smart platform<br>for connected object management",
      subtitle: "A modern solution to describe, manage, secure and search connected objects inside a smart building.",
      start: "Get started",
      discover: "Discover",
      feature1_title: "Management",
      feature1_text: "Add, edit and delete your connected objects easily.",
      feature2_title: "Security",
      feature2_text: "Access control, data protection and smart monitoring.",
      feature3_title: "Search",
      feature3_text: "Fast search by type, location or object status.",
      about_title: "Why IntelliBuild?",
      about_text: "IntelliBuild centralizes connected object management in a smart building to improve efficiency, security and visibility.",
      login_doc_title: "Login - IntelliBuild",
      login_title: "Login",
      login_sub: "Access your Smart Building platform",
      register_doc_title: "Sign up - IntelliBuild",
      register_title: "Create an account",
      register_sub: "Join the IntelliBuild platform",
      reset_doc_title: "Reset password - IntelliBuild",
      reset_title: "Reset password",
      reset_sub: "Choose a new password.",
      notifications_user_title: "User notifications",
      notifications_user_sub: "Personal channel: your borrows, returns and useful messages.",
      notifications_admin_title: "Admin notifications",
      notifications_admin_sub: "Channel reserved for administration actions and alerts.",
      notifications_user_empty: "No user notifications yet.",
      notifications_admin_empty: "No admin notifications yet.",
      my_objects_title: "My objects",
      my_objects_sub: "Objects you borrowed and can return",
      my_objects_empty: "You do not have any borrowed object.",
      stat_locations_suffix: "unique rooms"
    },
    ar: {}
  };

  function normalizeLocale(locale) {
    var value = String(locale || "").toLowerCase();
    if (value === "en" || value === "ar") return value;
    return "fr";
  }

  function rememberDefault(element) {
    if (!element || !element.dataset) return;
    var attr = element.getAttribute("data-attr");
    if (attr) {
      if (!element.dataset.i18nDefaultAttr) {
        element.dataset.i18nDefaultAttr = element.getAttribute(attr) || "";
      }
      return;
    }

    if (element.getAttribute("data-html") === "true") {
      if (!element.dataset.i18nDefaultHtml) {
        element.dataset.i18nDefaultHtml = element.innerHTML;
      }
      return;
    }

    if (!element.dataset.i18nDefaultText) {
      element.dataset.i18nDefaultText = element.textContent || "";
    }
  }

  function getTranslation(locale, key, fallback) {
    var pack = translations[normalizeLocale(locale)] || {};
    if (Object.prototype.hasOwnProperty.call(pack, key)) {
      return pack[key];
    }
    return fallback;
  }

  function applyTranslations(locale) {
    var activeLocale = normalizeLocale(locale || localStorage.getItem("lang") || document.documentElement.lang || "fr");
    document.documentElement.lang = activeLocale;

    document.querySelectorAll("[data-key]").forEach(function (element) {
      rememberDefault(element);
      var key = element.getAttribute("data-key");
      var attr = element.getAttribute("data-attr");
      var value;

      if (attr) {
        value = getTranslation(activeLocale, key, element.dataset.i18nDefaultAttr || "");
        element.setAttribute(attr, value);
        return;
      }

      if (element.getAttribute("data-html") === "true") {
        value = getTranslation(activeLocale, key, element.dataset.i18nDefaultHtml || "");
        element.innerHTML = value;
        return;
      }

      value = getTranslation(activeLocale, key, element.dataset.i18nDefaultText || "");
      element.textContent = value;
    });

    document.querySelectorAll(".lang").forEach(function (select) {
      if (select.value !== activeLocale) {
        select.value = activeLocale;
      }
    });
  }

  function setLanguage(locale) {
    var activeLocale = normalizeLocale(locale);
    localStorage.setItem("lang", activeLocale);
    applyTranslations(activeLocale);
  }

  function bindLanguageSelectors() {
    document.querySelectorAll(".lang").forEach(function (select) {
      if (select.dataset.i18nBound === "true") return;
      select.dataset.i18nBound = "true";
      select.addEventListener("change", function (event) {
        setLanguage(event.target.value);
      });
    });
  }

  function bootTranslations() {
    bindLanguageSelectors();
    applyTranslations(localStorage.getItem("lang") || "fr");
  }

  window.translations = translations;
  window.tr = function (key, fallback) {
    var locale = normalizeLocale(localStorage.getItem("lang") || document.documentElement.lang || "fr");
    return getTranslation(locale, key, fallback);
  };
  window.applyTranslations = applyTranslations;
  window.setLanguage = setLanguage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootTranslations, { once: true });
  } else {
    bootTranslations();
  }
})();
