"""Generate AI-Path hackathon PPT (10 slides max). Run: python docs/make_ppt.py"""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BG = RGBColor(0x0F, 0x17, 0x2A)
ACC = RGBColor(0x38, 0xBD, 0xF8)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUT = RGBColor(0x94, 0xA3, 0xB8)

def bg(slide):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = BG

def title(slide, text, sub=""):
    bg(slide)
    tx = slide.shapes.add_textbox(Inches(0.7), Inches(0.4), Inches(11.9), Inches(1.4))
    p = tx.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = WHITE
    if sub:
        tx2 = slide.shapes.add_textbox(Inches(0.7), Inches(1.5), Inches(11.9), Inches(0.8))
        q = tx2.text_frame.paragraphs[0]
        q.text = sub
        q.font.size = Pt(20)
        q.font.color.rgb = ACC

def bullets(slide, items, top=2.6, size=22):
    tx = slide.shapes.add_textbox(Inches(0.7), Inches(top), Inches(11.9), Inches(4.5))
    tf = tx.text_frame
    for i, it in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = it
        p.font.size = Pt(size)
        p.font.color.rgb = WHITE
        p.space_after = Pt(12)
        p.level = 0

slides = [
    ("AI-Path", "Personalised AI Tutor for Learning AI  •  Mohammed Shakib",
     ["Adaptive tutor that adjusts difficulty, explanations & practice to each learner's live progress",
      "Track: Personalised AI Tutor for Learning AI — Build Fast with AI Challenge 2026"]),
    ("Problem", "One-size-fits-all tutorials fail beginners",
     ["Beginners drown in generic content with no feedback loop",
      "Static quizzes never adapt; tutors don't know your weak spots",
      "Cloud AI costs money + leaks code; local AI can't reach other users"]),
    ("Solution", "A tutor that watches you learn, then adapts",
     ["12-unit adaptive path — every tick updates the whole app live",
      "Quizzes unlock Medium difficulty at 60% average",
      "Tutor receives your live profile (level, scores, current unit) every message",
      "Hybrid engine: local Ollama (free/private) + Groq cloud (works for everyone)"]),
    ("Key Features", "Everything is real-time — zero mock numbers",
     ["Live dashboard: progress ring, streak (real calendar days), activity feed",
      "Submit a quiz → transcript, charts, KPIs, recommendations update instantly",
      "Streaming tutor with code blocks, latency + engine badge per answer",
      "Auto level: Beginner → Intermediate → Advanced from real scores"]),
    ("Tech Stack", "Free-tier, reproducible",
     ["Next.js 16 + React 19 + Tailwind v4 + lucide-react",
      "Ollama llama3.1:8b (local) · Groq llama-3.3-70b (cloud fallback)",
      "localStorage progress store (Supabase schema ready for phase 2)",
      "Deploys on Vercel hobby tier — $0"]),
    ("Architecture", "How a message flows",
     ["Browser → /api/chat (provider: auto/groq/ollama) → Ollama :11434 → fallback Groq → reply",
      "Learner profile injected into system prompt every turn",
      "Quiz submit → store → dashboard / transcript / chart re-render via subscription",
      "Settings switch engine per-user; server default via AI_PROVIDER env"]),
    ("Adaptivity in Action", "The track requirement, demonstrated",
     ["Score <60%: tutor uses tiny steps, encouragement, Easy bank only",
      "Score ≥60%: Medium unlocks (comprehensions, pitfalls, Big-O)",
      "Stuck on Unit 5? Tutor suggests Unit-5 practice + quiz retry",
      "Demo: clear progress → Beginner tone; submit 5/5 → Intermediate tone"]),
    ("Results", "Measured on a real run",
     ["All pages render 200; build passes; tsc clean",
      "Local answer in ~15–30s on CPU (streamed); cloud fallback <5s",
      "Medium tier locked at 32% avg, unlocked after practice — adaptivity verified",
      "Zero hardcoded stats: every number traced to the store"]),
    ("Demo", "3-minute video plan (record on localhost:3000)",
     ["0:00–0:30 dashboard + tick a unit live  •  0:30–1:10 quiz Easy → submit → transcript updates",
      "1:10–2:00 tutor streams answer with engine badge  •  2:00–2:40 Medium unlock + level-up",
      "2:40–3:00 Settings engine switch + deployed Vercel link"]),
    ("Next & Disclosure", "Roadmap + honest AI-use note",
     ["Next: Supabase auth + multi-user profiles, voice mode, Hindi explanations",
      "AI tools used: OpenCode (Muse Spark) pair-programming; Ollama + Groq at runtime",
      "Quiz banks are curated; tutor prose is model-generated — disclosed in README",
      "Repo + live link + video: links on the title slide of this deck"]),
]

for t, s, items in slides:
    sl = prs.slides.add_slide(prs.slide_layouts[6])
    title(sl, t, s)
    bullets(sl, ["•  " + i for i in items])

prs.save("docs/AI-Path-Hackathon-Deck.pptx")
print("saved docs/AI-Path-Hackathon-Deck.pptx")
