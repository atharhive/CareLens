import os
import torch
import pandas as pd
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, Trainer
from utils import MultiInputDataset, MultiModalModel, collate_fn

# Path where checkpoints are saved
CHECKPOINT_DIR = "./outputs"
BEST_DIR = "./outputs/best_model_final"

def main():
    # Load dataset
    df = pd.read_csv("data/medical_extended_multiclass.csv")
    texts = df['text'].tolist()
    labels = df['label'].tolist()
    numeric_cols = df.columns.difference(['text', 'label'])
    numeric_feats = df[numeric_cols].values

    # Split (same seed as training!)
    _, val_texts, _, val_nums, _, val_labels = train_test_split(
        texts, numeric_feats, labels, test_size=0.2, random_state=42
    )

    tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
    val_dataset = MultiInputDataset(val_texts, val_nums, val_labels, tokenizer)

    best_acc, best_ckpt = 0.0, None

    # Go through all checkpoints
    for folder in os.listdir(CHECKPOINT_DIR):
        ckpt_path = os.path.join(CHECKPOINT_DIR, folder)
        if not os.path.isdir(ckpt_path):
            continue
        if not os.path.exists(os.path.join(ckpt_path, "pytorch_model.bin")):
            continue

        print(f"🔎 Evaluating checkpoint: {ckpt_path}")

        model = MultiModalModel("distilbert-base-uncased", num_numeric_features=len(numeric_cols), num_labels=len(set(labels)))
        model.load_state_dict(torch.load(os.path.join(ckpt_path, "pytorch_model.bin")))
        model.eval()

        trainer = Trainer(
            model=model,
            tokenizer=tokenizer,
            data_collator=collate_fn,
        )

        metrics = trainer.evaluate(eval_dataset=val_dataset)
        acc = metrics.get("eval_accuracy", None)

        print(f"   → Eval metrics: {metrics}")

        if acc and acc > best_acc:
            best_acc = acc
            best_ckpt = ckpt_path

    if best_ckpt:
        print(f"\n✅ Best checkpoint: {best_ckpt} with accuracy {best_acc:.4f}")
        # Copy best checkpoint into BEST_DIR
        os.system(f"rm -rf {BEST_DIR}")
        os.system(f"cp -r {best_ckpt} {BEST_DIR}")
    else:
        print("⚠️ No valid checkpoints found.")

if __name__ == "__main__":
    main()
