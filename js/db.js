// ============================================================
// DB.JS — Firebase Database Helpers
// ============================================================

import { db } from './firebase-config.js';

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    setDoc,
    query,
    where,
    orderBy,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================================
// COURSES
// ============================================================

// Get all active courses
export async function getCourses() {
    try {

        const snap = await getDocs(
            query(collection(db, 'courses'))
        );

        return snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

    } catch (err) {
        console.error('getCourses error:', err);
        return [];
    }
}


// Get single course
export async function getCourse(courseId) {
    try {

        console.log("DB PROJECT:", db.app.options.projectId);
        console.log("Trying courseId:", courseId);

        const ref = doc(db, "courses", courseId);

        console.log("Ref path:", ref.path);

        const snap = await getDoc(ref);

        console.log("Exists?", snap.exists());

        if (!snap.exists()) {
            console.log("NO DOC FOUND");
            return null;
        }

        const data = {
            id: snap.id,
            ...snap.data()
        };

        console.log("FOUND COURSE:", data);

        return data;

    } catch (err) {
        console.error("getCourse ERROR:", err);
        return null;
    }
}



// ============================================================
// ENROLLMENTS
// ============================================================


export async function getEnrollments(userId) {
    try {
        const [snap1, snap2] = await Promise.all([
            getDocs(query(collection(db, 'enrollments'), where('userId', '==', userId))),
            getDocs(query(collection(db, 'enrollments'), where('studentId', '==', userId)))
        ]);
        const map = new Map();
        const add = (doc) => {
            const data = doc.data();
            if (data.isActive !== false) {
                map.set(doc.id, { id: doc.id, ...data });
            }
        };
        snap1.docs.forEach(add);
        snap2.docs.forEach(add);
        return Array.from(map.values());
    } catch (err) {
        console.error('getEnrollments error:', err);
        return [];
    }
}

export async function getCourseEnrollments(courseId) {
    try {
        const snap = await getDocs(query(
            collection(db, 'enrollments'),
            where('courseId', '==', courseId),
            where('isActive', '==', true)
        ));
        return snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
    } catch (err) {
        console.error('getCourseEnrollments error:', err);
        return [];
    }
}

export async function enrollStudent(userId, courseId) {
    try {
        const docId = `${userId}_${courseId}`;
        const ref = doc(db, 'enrollments', docId);
        await setDoc(ref, {
            userId,
            courseId,
            isActive: true,
            enrolledAt: serverTimestamp()
        });
        return docId;
    } catch (err) {
        console.error('enrollStudent error:', err);
        return null;
    }
}

export async function unenrollStudent(userId, courseId) {
    try {
        const docId = `${userId}_${courseId}`;
        await deleteDoc(doc(db, 'enrollments', docId));
        
        const snap = await getDocs(query(
            collection(db, 'enrollments'),
            where('userId', '==', userId),
            where('courseId', '==', courseId)
        ));
        for (const d of snap.docs) {
            if (d.id !== docId) {
                await deleteDoc(d.ref);
            }
        }
    } catch (err) {
        console.error('unenrollStudent error:', err);
    }
}

export async function isEnrolled(userId, courseId) {
    try {
        console.log("========== ENROLLMENT CHECK ==========");
        console.log("USER ID:", userId);
        console.log("COURSE ID:", courseId);

        const enrollments = await getEnrollments(userId);

        console.log("ENROLLMENTS:", enrollments);

        const found = enrollments.some(e => {
            console.log("Comparing:");
            console.log("DB courseId:", `"${e.courseId}"`);
            console.log("Current courseId:", `"${courseId}"`);

            return String(e.courseId).trim() === String(courseId).trim();
        });

        console.log("ENROLLED?", found);
        console.log("=====================================");

        return found;
    } catch (err) {
        console.error("isEnrolled error:", err);
        return false;
    }
}
// ============================================================
// ADD COURSE
// ============================================================

export async function addCourse(courseData) {

    try {

        const ref = await addDoc(
            collection(db, 'courses'),
            {
                ...courseData,
                isActive: true,
                createdAt: serverTimestamp()
            }
        );

        return ref.id;

    } catch (err) {

        console.error('addCourse error:', err);
        return null;
    }
}


// ============================================================
// UPDATE NOTE
// ============================================================

export async function updateNote(noteId, noteData) {

    try {

        await updateDoc(
            doc(db, 'notes', noteId),
            noteData
        );

        return true;

    } catch (err) {

        console.error('updateNote error:', err);
        return false;
    }
}



// Delete Course

export async function deleteCourse(courseId) {
    try {
        await deleteDoc(doc(db, "courses", courseId));
        console.log("Course deleted:", courseId);
        return true;
    } catch (error) {
        console.error("Error deleting course:", error);
        return false;
    }
}
// ============================================================
// UPDATE COURSE
// ============================================================

export async function updateCourse(courseId, courseData) {

    try {

        await updateDoc(
            doc(db, 'courses', courseId),
            courseData
        );

        console.log("Course updated:", courseId);

        return true;

    } catch (err) {

        console.error('updateCourse error:', err);
        return false;
    }
}
// ======================================================
// LECTURES
// ======================================================

export async function addLecture(data) {
    const docRef = await addDoc(
        collection(db, "lectures"),
        {
            ...data,
            createdAt: serverTimestamp()
        }
    );

    return docRef.id;
}

export async function getLectures(courseId) {
    try {
        const q = query(
            collection(db, "lectures"),
            where("courseId", "==", courseId),
            orderBy("order", "asc")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        console.error("Error fetching lectures:", err);
        return [];
    }
}

export async function updateLecture(id, updatedData) {
    try {
        const ref = doc(db, "lectures", id);

        await updateDoc(ref, updatedData);

        return true;
    } catch (err) {
        console.error("Update lecture error:", err);
        throw err;
    }
}

export async function deleteLecture(id) {
    try {
        await deleteDoc(doc(db, "lectures", id));
        return true;
    } catch (err) {
        console.error("Delete lecture error:", err);
        throw err;
    }
}


// ======================================================
// NOTES
// ======================================================

export async function addNote(data) {
    const docRef = await addDoc(
        collection(db, "notes"),
        {
            ...data,
            uploadedAt: serverTimestamp()
        }
    );

    return docRef.id;
}

export async function getNotes(courseId) {
    try {
        const q = query(
            collection(db, "notes"),
            where("courseId", "==", courseId)
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        console.error("Error fetching notes:", err);
        return [];
    }
}

export async function deleteNote(id) {
    try {
        await deleteDoc(doc(db, "notes", id));
        return true;
    } catch (err) {
        console.error("Delete note error:", err);
        throw err;
    }
}
// ============================================================
// ANNOUNCEMENTS
// ============================================================


// Add announcement
export async function addAnnouncement(data) {

    try {

        const ref = await addDoc(
            collection(db, 'announcements'),
            {
                ...data,
                createdAt: serverTimestamp()
            }
        );

        return ref.id;

    } catch (err) {

        console.error('addAnnouncement error:', err);
        return null;
    }
}


// Update announcement
export async function updateAnnouncement(id, data) {

    try {

        await updateDoc(
            doc(db, 'announcements', id),
            data
        );

        return true;

    } catch (err) {

        console.error('updateAnnouncement error:', err);
        return false;
    }
}


// Delete announcement
export async function deleteAnnouncement(id) {

    try {

        await deleteDoc(
            doc(db, 'announcements', id)
        );

        return true;

    } catch (err) {

        console.error('deleteAnnouncement error:', err);
        return false;
    }
}
/// ============================================================
// COUPON REDEEM SYSTEM
// ============================================================

export async function redeemCoupon(
    userId,
    couponCode
) {

    try {

        const q = query(
            collection(db, "coupons"),
            where(
                "code",
                "==",
                couponCode.toUpperCase()
            )
        );

        const snap = await getDocs(q);

        // coupon not found
        if (snap.empty) {
            throw new Error(
                "Invalid coupon code"
            );
        }

        const couponDoc =
            snap.docs[0];

        const coupon =
            couponDoc.data();

        // inactive
        if (!coupon.isActive) {
            throw new Error(
                "Coupon inactive"
            );
        }

        // usage limit reached
        if (
            coupon.usedCount >=
            coupon.maxUses
        ) {
            throw new Error(
                "Coupon usage limit reached"
            );
        }

        // already enrolled
        const enrolled =
            await isEnrolled(
                userId,
                coupon.courseId
            );

        if (enrolled) {
            throw new Error(
                "Already enrolled in this course"
            );
        }

        // enroll student
        await enrollStudent(
            userId,
            coupon.courseId
        );

        // increase usage
        await updateDoc(
            couponDoc.ref,
            {
                usedCount:
                    increment(1)
            }
        );

        // IMPORTANT FIX
        return {
            success: true,
            courseId:
                coupon.courseId,
            message:
                "Course unlocked successfully!"
        };

    } catch (err) {

        console.error(
            "redeemCoupon error:",
            err
        );

        throw err;
    }
}
// ============================================================
// COUPONS (ADMIN)
// ============================================================

export async function createCoupon(
    code,
    courseId
) {
    try {

        const couponCode =
            code.toUpperCase().trim();

        // check duplicate code
        const snap =
            await getDocs(query(
                collection(db, 'coupons'),
                where(
                    'code',
                    '==',
                    couponCode
                )
            ));

        if (!snap.empty) {
            throw new Error(
                'Coupon already exists'
            );
        }

        const ref =
            await addDoc(
                collection(db, 'coupons'),
                {
                    code: couponCode,
                    courseId,
                    isActive: true,

                    // ONE TIME USE
                    maxUses: 1,
                    usedCount: 0,

                    createdAt:
                        serverTimestamp()
                }
            );

        return ref.id;

    } catch (err) {
        console.error(
            'createCoupon error:',
            err
        );

        throw err;
    }
}


export async function getCoupons() {
    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    'coupons'
                )
            );

        return snap.docs.map(d => {
            const data = d.data();
            // Normalize: derive isUsed from usedCount >= maxUses
            const isUsed = (data.usedCount || 0) >= (data.maxUses || 1);
            return {
                id: d.id,
                ...data,
                isUsed
            };
        });

    } catch (err) {

        console.error(
            'getCoupons error:',
            err
        );

        return [];
    }
}

// ============================================================
// GENERATE COUPON CODE HELPER
// ============================================================

/**
 * Generates a random coupon code.
 * @param {string} prefix - Optional prefix (e.g. 'PP')
 * @returns {string} e.g. "PP-A1B2C3D4"
 */
export function generateCouponCode(prefix = 'PP') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}-${code}`;
}

// Alias: addCoupon = createCoupon (for backward compatibility)
export const addCoupon = createCoupon;


// ============================================================
// GET SINGLE STUDENT
// ============================================================

export async function getStudent(uid) {
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) {
            // Try 'students' collection as fallback
            const snap2 = await getDoc(doc(db, 'students', uid));
            if (!snap2.exists()) return null;
            return { id: snap2.id, ...snap2.data() };
        }
        return { id: snap.id, ...snap.data() };
    } catch (err) {
        console.error('getStudent error:', err);
        return null;
    }
}


export async function deleteCoupon(
    couponId
) {
    try {

        await deleteDoc(
            doc(
                db,
                'coupons',
                couponId
            )
        );

    } catch (err) {

        console.error(
            'deleteCoupon error:',
            err
        );

        throw err;
    }
}


// ============================================================
// STUDENT MANAGEMENT
// ============================================================

export async function getStudents() {
    try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const students = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Fetch from 'students' collection as fallback / merge
        const snap2 = await getDocs(collection(db, 'students'));
        const map = new Map();
        students.forEach(s => map.set(s.id, s));
        snap2.docs.forEach(doc => {
            if (!map.has(doc.id)) {
                map.set(doc.id, { id: doc.id, ...doc.data(), role: 'student' });
            }
        });

        return Array.from(map.values());
    } catch (err) {
        console.error('getStudents error:', err);
        return [];
    }
}

export async function updateStudent(uid, data) {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            await updateDoc(userRef, data);
        }

        const studentRef = doc(db, 'students', uid);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
            await updateDoc(studentRef, data);
        }

        return true;
    } catch (err) {
        console.error('updateStudent error:', err);
        throw err;
    }
}

export async function deleteStudent(uid) {
    try {
        // Delete from 'users'
        await deleteDoc(doc(db, 'users', uid));
        // Delete from 'students'
        await deleteDoc(doc(db, 'students', uid));

        // Delete associated enrollments
        const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('userId', '==', uid)));
        for (const doc of enrollSnap.docs) {
            await deleteDoc(doc.ref);
        }
        const enrollSnap2 = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', uid)));
        for (const doc of enrollSnap2.docs) {
            await deleteDoc(doc.ref);
        }

        return true;
    } catch (err) {
        console.error('deleteStudent error:', err);
        throw err;
    }
}

export async function setStudentActive(uid, isActive) {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            await updateDoc(userRef, { isActive });
        }

        const studentRef = doc(db, 'students', uid);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
            await updateDoc(studentRef, { isActive });
        }

        return true;
    } catch (err) {
        console.error('setStudentActive error:', err);
        throw err;
    }
}
// ============================================================
// ANNOUNCEMENTS
// ============================================================

export async function createAnnouncement(data) {
    try {
        const ref = await addDoc(
            collection(db, "announcements"),
            {
                title: data.title,
                body: data.body,
                category: data.category || "general",
                createdAt: serverTimestamp()
            }
        );

        return ref.id;
    } catch (err) {
        console.error("createAnnouncement error:", err);
        return null;
    }
}

export async function getAnnouncements() {
    try {

        const q = query(
            collection(db, "announcements"),
            orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

    } catch (err) {

        console.error(
            "getAnnouncements error:",
            err
        );

        return [];
    }
}

// ============================================================
// STUDENT PROGRESS TRACKING
// ============================================================

export async function saveLastWatched(userId, courseId, lectureId, lectureIndex) {
    try {
        const q = query(
            collection(db, 'enrollments'),
            where('userId', '==', userId),
            where('courseId', '==', courseId)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
            // Check legacy studentId field
            const q2 = query(
                collection(db, 'enrollments'),
                where('studentId', '==', userId),
                where('courseId', '==', courseId)
            );
            const snap2 = await getDocs(q2);
            if (snap2.empty) return false;
            await updateDoc(snap2.docs[0].ref, {
                lastWatchedLectureId: lectureId,
                lastWatchedIndex: lectureIndex,
                lastWatchedAt: serverTimestamp()
            });
            return true;
        }
        await updateDoc(snap.docs[0].ref, {
            lastWatchedLectureId: lectureId,
            lastWatchedIndex: lectureIndex,
            lastWatchedAt: serverTimestamp()
        });
        return true;
    } catch (err) {
        console.error('saveLastWatched error:', err);
        return false;
    }
}

export async function toggleLectureCompletion(userId, courseId, lectureId, isCompleted) {
    try {
        let enrollmentRef = null;
        let enrollmentData = null;

        const q = query(
            collection(db, 'enrollments'),
            where('userId', '==', userId),
            where('courseId', '==', courseId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            enrollmentRef = snap.docs[0].ref;
            enrollmentData = snap.docs[0].data();
        } else {
            const q2 = query(
                collection(db, 'enrollments'),
                where('studentId', '==', userId),
                where('courseId', '==', courseId)
            );
            const snap2 = await getDocs(q2);
            if (snap2.empty) return null;
            enrollmentRef = snap2.docs[0].ref;
            enrollmentData = snap2.docs[0].data();
        }

        let completed = enrollmentData.completedLectures || [];
        if (isCompleted) {
            if (!completed.includes(lectureId)) completed.push(lectureId);
        } else {
            completed = completed.filter(id => id !== lectureId);
        }

        // Fetch lectures count to calculate progress percentage
        const lectures = await getLectures(courseId);
        const total = lectures.length;
        const percentage = total > 0 ? Math.round((completed.length / total) * 100) : 0;

        await updateDoc(enrollmentRef, {
            completedLectures: completed,
            progressPercentage: percentage
        });

        return { completedLectures: completed, progressPercentage: percentage };
    } catch (err) {
        console.error('toggleLectureCompletion error:', err);
        throw err;
    }
}

export async function getEnrollmentProgress(userId, courseId) {
    try {
        const q = query(
            collection(db, 'enrollments'),
            where('userId', '==', userId),
            where('courseId', '==', courseId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            const data = snap.docs[0].data();
            return {
                completedLectures: data.completedLectures || [],
                progressPercentage: data.progressPercentage || 0,
                lastWatchedLectureId: data.lastWatchedLectureId || null,
                lastWatchedIndex: data.lastWatchedIndex !== undefined ? data.lastWatchedIndex : null
            };
        } else {
            const q2 = query(
                collection(db, 'enrollments'),
                where('studentId', '==', userId),
                where('courseId', '==', courseId)
            );
            const snap2 = await getDocs(q2);
            if (snap2.empty) return { completedLectures: [], progressPercentage: 0, lastWatchedLectureId: null, lastWatchedIndex: null };
            const data = snap2.docs[0].data();
            return {
                completedLectures: data.completedLectures || [],
                progressPercentage: data.progressPercentage || 0,
                lastWatchedLectureId: data.lastWatchedLectureId || null,
                lastWatchedIndex: data.lastWatchedIndex !== undefined ? data.lastWatchedIndex : null
            };
        }
    } catch (err) {
        console.error('getEnrollmentProgress error:', err);
        return { completedLectures: [], progressPercentage: 0, lastWatchedLectureId: null, lastWatchedIndex: null };
    }
}