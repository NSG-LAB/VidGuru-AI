import requests
import json
import time

BASE_URL = "http://localhost:8005/api/v1"

def run_tests():
    print("🧪 Starting VidGuru AI End-to-End Integration Verification...")

    # 1. Health Check
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✅ 1. Health Check passed:", res.json())

    # 2. Ingest Document (RAG)
    sample_text = """
    # Deep Learning & Attention Mechanism
    In traditional RNNs, information is compressed into a single hidden vector, causing information bottlenecks.
    Self-Attention solves this by computing similarity between Query (Q) and Key (K) vectors:
    Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V
    Multi-head attention enables the model to jointly attend to information from different representation subspaces.
    """
    files = {'file': ('attention_notes.txt', sample_text, 'text/plain')}
    res = requests.post(f"{BASE_URL}/documents/upload", files=files)
    assert res.status_code == 200, f"Document upload failed: {res.text}"
    doc_data = res.json()
    doc_id = doc_data["doc_id"]
    print("✅ 2. RAG Document Ingestion passed! Doc ID:", doc_id, "Chunks:", doc_data["num_chunks"])

    # 3. Create Personalized Lesson Plan (Hinglish + Undergraduate level)
    plan_payload = {
        "topic": "Self-Attention Mechanism in Transformers",
        "student_profile": {
            "grade_level": "undergraduate",
            "language": "Hinglish",
            "learning_goal": "deep_conceptual",
            "time_budget_mins": 15,
            "learning_style": "visual_analogies",
            "teacher_persona": "Dr. Nova (Intuitive & Warm)"
        },
        "doc_id": doc_id,
        "raw_notes": sample_text
    }
    res = requests.post(f"{BASE_URL}/lesson-plan/create", json=plan_payload)
    assert res.status_code == 200, f"Lesson plan creation failed: {res.text}"
    plan = res.json()
    plan_id = plan["plan_id"]
    print("✅ 3. Personalized Lesson Plan created! Plan ID:", plan_id, "Modules:", len(plan["modules"]))

    # 4. Execute Teaching Step 1 (Speech script + LaTeX + Mermaid + Audio generation)
    step_payload = {
        "plan_id": plan_id,
        "step_id": 1,
        "doc_id": doc_id
    }
    res = requests.post(f"{BASE_URL}/classroom/step", json=step_payload)
    assert res.status_code == 200, f"Teaching step execution failed: {res.text}"
    step_data = res.json()
    print("✅ 4. Teaching Step executed successfully!")
    print("   - Title:", step_data["title"])
    print("   - Spoken Script Preview:", step_data["teacher_script"][:80] + "...")
    print("   - Whiteboard Visuals Generated:", len(step_data.get("visuals", [])))
    print("   - Audio Stream URL:", step_data.get("audio_url"))
    print("   - Formative Checkpoint Prompt:", step_data.get("formative_question", {}).get("prompt"))

    # 5. Evaluate Student Response (Misconception Diagnosis)
    misconception_answer = {
        "plan_id": plan_id,
        "step_id": 1,
        "question_prompt": step_data.get("formative_question", {}).get("prompt", "Explain attention"),
        "student_response": "I think self-attention is basically calculating normal string match distance between characters."
    }
    res = requests.post(f"{BASE_URL}/classroom/evaluate", json=misconception_answer)
    assert res.status_code == 200, f"Evaluation failed: {res.text}"
    eval_data = res.json()
    print("✅ 5. Socratic Misconception Diagnosis passed!")
    print("   - Is Correct:", eval_data["is_correct"])
    print("   - Socratic Feedback:", eval_data["socratic_feedback"])
    print("   - Next Action:", eval_data["next_action"])

    # 6. Generate Final Mastery Quiz
    res = requests.post(f"{BASE_URL}/assessment/quiz/{plan_id}")
    assert res.status_code == 200, f"Quiz generation failed: {res.text}"
    quiz_data = res.json()
    quiz_id = quiz_data["quiz_id"]
    print("✅ 6. Final Mastery Quiz generated! Quiz ID:", quiz_id, "Questions:", len(quiz_data["questions"]))

    # 7. Submit Quiz and Generate Learning Report
    answers = {q["id"]: q["correct_option_index"] for q in quiz_data["questions"]}
    submit_payload = {
        "plan_id": plan_id,
        "quiz_id": quiz_id,
        "answers": answers,
        "time_spent_seconds": 90
    }
    res = requests.post(f"{BASE_URL}/assessment/submit-quiz", json=submit_payload)
    assert res.status_code == 200, f"Quiz submission failed: {res.text}"
    report = res.json()
    print("✅ 7. Learning Analytics & Spaced Repetition Report generated!")
    print("   - Score:", report["overall_score_pct"], "%")
    print("   - Mastery Tier:", report["mastery_level"])
    print("   - Spaced Repetition Schedule:", len(report["spaced_repetition_plan"]), "scheduled revisions")
    print("   - Notes MD length:", len(report["downloadable_notes_md"]), "bytes")

    print("\n🎉 ALL 7 END-TO-END PEDAGOGICAL PIPELINE TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    run_tests()
