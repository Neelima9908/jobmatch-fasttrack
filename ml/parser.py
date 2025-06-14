import pdfplumber
import spacy
import re
import sys
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

nlp = spacy.load("en_core_web_sm")

# Load static job roles
def load_jobs():
    return [
        {
            "title": "Frontend Developer",
            "description": "Experience with React, JavaScript, HTML, CSS, frontend tools."
        },
        {
            "title": "Backend Developer",
            "description": "Experience with Node.js, REST APIs, databases, and authentication."
        },
        {
            "title": "Data Scientist",
            "description": "Proficiency in Python, ML, data analysis, and statistics."
        }
    ]

def extract_text(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_details(text):
    doc = nlp(text)
    email = re.search(r"\S+@\S+", text)
    phone = re.search(r"\+?\d[\d\-\s]{7,}", text)
    predefined_skills = ["Python", "Java", "React", "Node.js", "SQL", "HTML", "CSS"]
    skills = [skill for skill in predefined_skills if skill.lower() in text.lower()]
    name = doc.ents[0].text if doc.ents else "N/A"
    return {
        "name": name,
        "email": email.group() if email else "N/A",
        "phone": phone.group() if phone else "N/A",
        "skills": skills,
        "full_text": text
    }

def match_jobs(resume_text):
    jobs = load_jobs()
    corpus = [resume_text] + [job["description"] for job in jobs]
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(corpus)
    scores = cosine_similarity(vectors[0:1], vectors[1:]).flatten()
    results = sorted(zip(jobs, scores), key=lambda x: x[1], reverse=True)
    return [{"title": job["title"], "score": round(score * 100, 2)} for job, score in results[:3]]

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    resume_text = extract_text(pdf_path)
    parsed = extract_details(resume_text)
    matched = match_jobs(resume_text)
    output = {
        "parsed": parsed,
        "matches": matched
    }
    print(json.dumps(output))
