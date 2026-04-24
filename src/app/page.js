import { loginAction, registerAction } from '@/app/actions/auth';
import { AuthForms, AIPromptPanel } from '@/components/AuthForms';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();
  if (session) {
    if (session.role === 'ADMIN') redirect('/admin');
    else redirect('/dashboard');
  }

  const promptText = `Act as a precise OCR and data extraction tool.

**Task:** Extract all vocabulary pairs from the provided image(s) and convert them into a raw JSON array.

**Output Format:**
Return a single JSON array of objects. Each object must strictly follow this key-value pair structure:
[
 {
   "English": "extracted English term",
   "German": "extracted German translation"
 },
 ...
]

**Extraction Rules:**
1. **Verbs:** Include the "to" prefix and any placeholders like "(sb/sth)" exactly as they appear in the source.
2. **Nouns:** Include gender markers or plural indicators if they are part of the text.
3. **Accuracy:** Maintain the original casing. Ensure German Umlauts (ä, ö, ü) and Eszett (ß) are preserved.
4. **Cleanup:** Remove page numbers, phonetic transcriptions (IPA), and icons. Only extract the words and their translations.
5. **No Prose:** Output ONLY the JSON code block. Do not provide an introduction or conclusion.`;

  return (
    <section id="landing-screen" className="screen active" style={{ display: 'flex' }}>
      <div className="landing-container">
        <div className="logo-area">
          <div className="logo-icon">📚</div>
          <h1>Vokabeltrainer</h1>
          <p className="subtitle">Lerne smarter mit dem Leitner-System</p>
        </div>
        
        <AuthForms loginAction={loginAction} registerAction={registerAction} />
        
        <div className="landing-hint">
          <p>Tipp: Logge dich ein, um Notizbücher zu erstellen und deinen Fortschritt dauerhaft zu speichern.</p>
        </div>

        <AIPromptPanel promptText={promptText} />
      </div>
    </section>
  );
}
