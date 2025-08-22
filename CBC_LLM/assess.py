import torch
from transformers import AutoTokenizer
from safetensors.torch import load_file
from utils import MultiModalModel, load_label_mapping

def assess_report(text, numeric_feats, model_dir="./outputs/best_model_final"):
    tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
    label_map = load_label_mapping(f"{model_dir}/label_mapping.json")

    # Load trained model
    model = MultiModalModel(
        "distilbert-base-uncased",
        num_numeric_features=len(numeric_feats),
        num_labels=len(label_map)
    )
    # Load safetensors weights
    state_dict = load_file(f"{model_dir}/model.safetensors")
    model.load_state_dict(state_dict)
    model.eval()

    # Preprocess
    encoding = tokenizer(
        text,
        max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt"
    )
    input_ids = encoding["input_ids"]
    attention_mask = encoding["attention_mask"]
    numeric_feats = torch.tensor([numeric_feats], dtype=torch.float)

    with torch.no_grad():
        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            numeric_feats=numeric_feats
        )
        probs = torch.softmax(outputs["logits"], dim=1)
        pred_idx = torch.argmax(probs, dim=1).item()
        return label_map[str(pred_idx)], probs.tolist()[0]

# Example usage
if __name__ == "__main__":
    text = "CBC report with low hemoglobin and borderline platelets."
    # Hb, RBC, WBC, Platelet, Neutro, Lympho, Eosino, Mono, Baso
    numeric_feats = [10.5, 3.9, 7500, 140000, 58, 35, 2, 5, 1]
    label, probs = assess_report(text, numeric_feats)
    print("Prediction:", label)
    print("Probabilities:", probs)
