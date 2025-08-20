import torch
from transformers import AutoTokenizer
from utils import MultiModalModel, load_label_mapping

def assess_report(text, numeric_feats, model_dir="./outputs/best_model_final"):
    tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
    label_map = load_label_mapping(f"{model_dir}/label_mapping.json")

    # Load trained model
    model = MultiModalModel("distilbert-base-uncased", num_numeric_features=len(numeric_feats), num_labels=len(label_map))
    model.load_state_dict(torch.load(f"{model_dir}/pytorch_model.bin"))
    model.eval()

    # Preprocess
    encoding = tokenizer(text, max_length=128, padding="max_length", truncation=True, return_tensors="pt")
    input_ids = encoding["input_ids"]
    attention_mask = encoding["attention_mask"]
    numeric_feats = torch.tensor([numeric_feats], dtype=torch.float)

    with torch.no_grad():
        outputs = model(input_ids=input_ids, attention_mask=attention_mask, numeric_feats=numeric_feats)
        probs = torch.softmax(outputs["logits"], dim=1)
        pred_idx = torch.argmax(probs, dim=1).item()
        return label_map[str(pred_idx)], probs.tolist()[0]

# Example usage:
if __name__ == "__main__":
    text = "CBC report with low hemoglobin and borderline platelets."
    numeric_feats = [12.5, 5.2, 9000, 150000]  # example Hb, RBC, WBC, Platelet
    label, probs = assess_report(text, numeric_feats)
    print("Prediction:", label)
    print("Probabilities:", probs)
