# 🧠 CaretakerCatena  
**AI Companion for Alzheimer’s Caregivers**  
Built for the 0G Hackathon

---

## 🌟 Overview

CaretakerCatena is an AI-powered companion designed to support people caring for loved ones with **Alzheimer’s disease or dementia**.

It reduces caregiver stress, supports emotional wellbeing, and provides simple, practical strategies for daily routines and difficult behaviors — **without giving medical advice**.

Caregivers often feel overwhelmed, isolated, and under-resourced. CaretakerCatena provides:

- Warm emotional support  
- Pattern recognition from a private, on-device journal  
- Practical, focused guidance  
- Safety-aligned responses  
- A gentle, calming interface  

This MVP integrates a local-first frontend, a Node/TypeScript backend, and 0G for decentralized data access.

---

## 🎥 Demo Features (MVP)

### ✔ Patient Overview

A collapsible profile card showing:

- Name  
- Diagnosis  
- Living situation  
- Personality  
- Key concerns  
- Medications & daily routine (saved locally)

Includes a fallback patient (“Marta”) for instant demo functionality.

---

### ✔ Caregiver Journal (Private & Local)

- Entries stored locally with `localStorage`  
- AI reads a **summary** of recent entries (never the full data)  
- Helps detect patterns such as sundowning, agitation triggers, or sleep issues  
- Data **never leaves the device** unless future 0G features are added  

---

### ✔ Caregiver Chat (Safety-Aligned AI)

The chat assistant:

- Validates emotions before giving strategies  
- Provides **3–7 simple, practical, routine-based tips**  
- Encourages caregiver self-care  
- Uses profile + journal context to personalize answers  
- Avoids **all** medical advice or diagnosis  
- Speaks warmly, calmly, and humanely  
- Adds subtle social proof:  
  **🟩 42 caregivers found this helpful**

---

### ✔ System Panel

A collapsible diagnostics section for:

- Backend health check  
- 0G account balance  
- Connection status indicators  

---

## 🛡 Safety Philosophy

CaretakerCatena is designed with strict safety constraints.

### It **never**:

- ❌ Diagnoses conditions  
- ❌ Evaluates disease stage  
- ❌ Recommends or adjusts medications  
- ❌ Provides emergency or crisis instructions  
- ❌ Replaces a doctor or clinician  

### It **always**:

- ✔ Offers environmental, routine, emotional, and behavioral guidance  
- ✔ Suggests contacting medical professionals when appropriate  
- ✔ Prioritizes caregiver mental wellbeing  
- ✔ Speaks with empathy and emotional intelligence  
- ✔ Validates feelings before offering strategies  

---

## ❤️ System Prompt Philosophy

Every response follows this structure:

### 1. **Emotional validation**  
A brief, calming reflection acknowledging the caregiver’s situation.

### 2. **3–7 practical strategies**  
Simple, concrete steps a tired caregiver can apply immediately.

### 3. **Optional self-care reminder**  
*"You deserve rest too."*

### 4. **Safety note when needed**  
Subtle, non-clinical, gentle.

### Tone requirements:

- Warm  
- Calm  
- Human  
- Reassuring  
- Never judgmental  
- Never robotic  
- Never clinical  
