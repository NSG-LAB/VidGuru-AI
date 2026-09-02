import requests

BASE_URL = "http://localhost:8005/api/v1"


def assert_status(response: requests.Response, expected: int, label: str) -> None:
    assert response.status_code == expected, f"{label} failed ({response.status_code}): {response.text}"


def run_tests() -> None:
    print("🧪 Starting VidGuru AI End-to-End Integration Verification...")

    # 1. Health Check
    res = requests.get(f"{BASE_URL}/health")
    assert_status(res, 200, "Health check")
    print("✅ 1. Health Check passed:", res.json())

    # 2. Validation checks for upload/malformed input
    bad_file = {"file": ("script.exe", b"MZ", "application/octet-stream")}
    res = requests.post(f"{BASE_URL}/documents/upload", files=bad_file)
    assert_status(res, 400, "Invalid extension upload rejection")

    res = requests.post(f"{BASE_URL}/lesson-plan/create", json={"topic": "Missing profile"})
    assert_status(res, 422, "Malformed lesson plan payload validation")
    print("✅ 2. Validation checks passed")

    # 3. Ingest Document (RAG)
    sample_text = """
    # Deep Learning & Attention Mechanism
    In traditional RNNs, information is compressed into a single hidden vector, causing information bottlenecks.
    Self-Attention solves this by computing similarity between Query (Q) and Key (K) vectors:
    Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V
    Multi-head attention enables the model to jointly attend to information from different representation subspaces.
    """
    files = {"file": ("attention_notes.txt", sample_text, "text/plain")}
    res = requests.post(f"{BASE_URL}/documents/upload", files=files)
    assert_status(res, 200, "Document upload")
    doc_data = res.json()
    doc_id = doc_data["doc_id"]
    print("✅ 3. RAG Document Ingestion passed! Doc ID:", doc_id, "Chunks:", doc_data["num_chunks"])

    # 4. Create Personalized Lesson Plan
    plan_payload = {
        "topic": "Self-Attention Mechanism in Transformers",
        "student_profile": {
            "grade_level": "undergraduate",
            "language": "Hinglish",
            "learning_goal": "deep_conceptual",
            "time_budget_mins": 15,
            "learning_style": "visual_analogies",
            "teacher_persona": "Dr. Nova (Intuitive & Warm)",
        },
        "doc_id": doc_id,
        "raw_notes": sample_text,
    }
    res = requests.post(f"{BASE_URL}/lesson-plan/create", json=plan_payload)
    assert_status(res, 200, "Lesson plan creation")
    plan = res.json()
    plan_id = plan["plan_id"]
    print("✅ 4. Personalized Lesson Plan created! Plan ID:", plan_id, "Modules:", len(plan["modules"]))

    # 5. Validate not-found handling
    res = requests.post(f"{BASE_URL}/classroom/step", json={"plan_id": "missing-plan", "step_id": 1})
    assert_status(res, 404, "Missing plan error handling")
    print("✅ 5. Missing-state error handling passed")

    # 6. Execute Teaching Step
    res = requests.post(f"{BASE_URL}/classroom/step", json={"plan_id": plan_id, "step_id": 1, "doc_id": doc_id})
    assert_status(res, 200, "Teaching step execution")
    step_data = res.json()
    print("✅ 6. Teaching Step executed successfully!")
    print("   - Title:", step_data["title"])
    print("   - Spoken Script Preview:", step_data["teacher_script"][:80] + "...")
    print("   - Whiteboard Visuals Generated:", len(step_data.get("visuals", [])))
    print("   - Audio Stream URL:", step_data.get("audio_url"))
    print("   - Formative Checkpoint Prompt:", step_data.get("formative_question", {}).get("prompt"))

    # 7. Evaluate Student Response (Misconception Diagnosis)
    misconception_answer = {
        "plan_id": plan_id,
        "step_id": 1,
        "question_prompt": step_data.get("formative_question", {}).get("prompt", "Explain attention"),
        "student_response": "I think self-attention is basically calculating normal string match distance between characters.",
    }
    res = requests.post(f"{BASE_URL}/classroom/evaluate", json=misconception_answer)
    assert_status(res, 200, "Evaluation")
    eval_data = res.json()
    print("✅ 7. Socratic Misconception Diagnosis passed!")
    print("   - Is Correct:", eval_data["is_correct"])
    print("   - Socratic Feedback:", eval_data["socratic_feedback"])
    print("   - Next Action:", eval_data["next_action"])

    # 8. Generate quiz and submit intentionally wrong answers to validate score path
    res = requests.post(f"{BASE_URL}/assessment/quiz/{plan_id}")
    assert_status(res, 200, "Quiz generation")
    quiz_data = res.json()
    quiz_id = quiz_data["quiz_id"]

    answers = {}
    for q in quiz_data["questions"]:
        num_options = max(1, len(q["options"]))
        wrong_answer = (q["correct_option_index"] + 1) % num_options
        answers[q["id"]] = wrong_answer

    res = requests.post(
        f"{BASE_URL}/assessment/submit-quiz",
        json={
            "plan_id": plan_id,
            "quiz_id": quiz_id,
            "answers": answers,
            "time_spent_seconds": 90,
        },
    )
    assert_status(res, 200, "Quiz submission")
    report = res.json()
    assert report["overall_score_pct"] < 100, "Score path check failed: expected non-perfect score for wrong answers"
    print("✅ 8. Quiz scoring path validated with non-perfect answers:", report["overall_score_pct"], "%")

    # 9. STT fallback behavior check (empty file should be rejected or provider not configured)
    res = requests.post(
        f"{BASE_URL}/voice/stt",
        files={"file": ("empty.wav", b"", "audio/wav")},
    )
    assert res.status_code in {400, 503}, f"Unexpected STT fallback status: {res.status_code} / {res.text}"
    print("✅ 9. STT fallback/config behavior validated with status:", res.status_code)

    print("\n🎉 ALL INTEGRATION CHECKS PASSED!\n")


if __name__ == "__main__":
    run_tests()
