document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const res = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // 1. On stocke le rôle et le token pour les utiliser plus tard
            localStorage.setItem("userRole", data.role);
            localStorage.setItem("userToken", data.access_token);
            localStorage.setItem("userEmail", data.email);

            alert("Connexion réussie !");

            // 2. REDIRECTION LOGIQUE
            // Si c'est un admin -> index.html (Gestion complète)
            // Sinon (user) -> user.html
            if (data.role === "admin") {
                window.location.href = "index.html"; 
            } else {
                window.location.href = "user.html"; 
            }

        } else {
            alert("Erreur : " + (data.detail || "Identifiants invalides"));
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        alert("Impossible de contacter le serveur.");
    }
});