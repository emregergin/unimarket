/**
 * Mirror of the DB allow-list for fast client-side validation feedback.
 * Source of truth: `university_domains` table in Postgres.
 */
export const UNIVERSITY_DOMAINS: Record<string, { name: string; city: string }> = {
  "boun.edu.tr": { name: "Boğaziçi Üniversitesi", city: "İstanbul" },
  "metu.edu.tr": { name: "Orta Doğu Teknik Üniversitesi", city: "Ankara" },
  "itu.edu.tr": { name: "İstanbul Teknik Üniversitesi", city: "İstanbul" },
  "bilkent.edu.tr": { name: "Bilkent Üniversitesi", city: "Ankara" },
  "ku.edu.tr": { name: "Koç Üniversitesi", city: "İstanbul" },
  "sabanciuniv.edu": { name: "Sabancı Üniversitesi", city: "İstanbul" },
  "hacettepe.edu.tr": { name: "Hacettepe Üniversitesi", city: "Ankara" },
  "ankara.edu.tr": { name: "Ankara Üniversitesi", city: "Ankara" },
  "istanbul.edu.tr": { name: "İstanbul Üniversitesi", city: "İstanbul" },
  "yildiz.edu.tr": { name: "Yıldız Teknik Üniversitesi", city: "İstanbul" },
  "ege.edu.tr": { name: "Ege Üniversitesi", city: "İzmir" },
  "deu.edu.tr": { name: "Dokuz Eylül Üniversitesi", city: "İzmir" },
};

export function lookupUniversity(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  return UNIVERSITY_DOMAINS[domain] ?? null;
}

export function isUniversityEmail(email: string): boolean {
  return lookupUniversity(email) !== null || /\.edu\.tr$/i.test(email);
}
