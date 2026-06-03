// ============================================================
// AUTH.JS — Authentication helpers
// ============================================================
import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- Sign Up (Student only) ---
export async function signupStudent(email, password, name, mobile) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        name,
        mobile,
        role: 'student',
        isActive: true,
        createdAt: serverTimestamp()
    });
    return cred.user;
}

// --- Login ---
export async function loginUser(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
}

// --- Logout ---
export async function logoutUser() {
    try {
        await signOut(auth);
    } catch (err) {
        console.error("SignOut error:", err);
    }
    document.cookie = "logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    sessionStorage.clear();
    localStorage.clear();
    const isInSubdir = window.location.pathname.includes('/student/') || window.location.pathname.includes('/admin/');
    window.location.replace(isInSubdir ? '../login.html' : 'login.html');
}

// --- Get user role from Firestore ---
export async function getUserRole(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data().role;
    // Fallback to students collection
    const snap2 = await getDoc(doc(db, 'students', uid));
    if (snap2.exists()) return 'student';
    return null;
}

// --- Get full user profile ---
export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    // Fallback to students collection
    const snap2 = await getDoc(doc(db, 'students', uid));
    if (snap2.exists()) return { id: snap2.id, ...snap2.data(), role: 'student' };
    return null;
}

// --- Password Reset Email ---
export async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
}

// --- Change Password (requires re-auth) ---
export async function changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
}

// --- Route Guard: require auth + optional role ---
// Call at top of protected pages. Redirects if not authenticated.
export function requireAuth(requiredRole = null, redirectTo = '../login.html') {
    return new Promise((resolve, reject) => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            unsub();
            if (!user) {
                document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
                window.location.href = redirectTo;
                reject('not-authenticated');
                return;
            }
            // Set cookie securely
            document.cookie = "logged_in=true; path=/; max-age=31536000; SameSite=Lax";
            if (requiredRole) {
                const role = await getUserRole(user.uid);
                if (role !== requiredRole) {
                    if (role === 'admin') {
                        window.location.href = redirectTo.includes('../') ? '../admin/dashboard.html' : 'admin/dashboard.html';
                    } else if (role === 'student') {
                        window.location.href = redirectTo.includes('../') ? '../student/dashboard.html' : 'student/dashboard.html';
                    } else {
                        // Role is null/unknown (e.g. no profile yet) — redirect to login to avoid loops
                        window.location.href = redirectTo;
                    }
                    reject('wrong-role');
                    return;
                }
            }
            resolve(user);
        });
    });
}

// --- Listen to auth state changes ---
export function onAuth(callback) {
    return onAuthStateChanged(auth, callback);
}

// --- Get current user (sync, may be null) ---
export function currentUser() {
    return auth.currentUser;
}
