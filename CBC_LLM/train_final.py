import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, Trainer, TrainingArguments
from utils import MultiInputDataset, MultiModalModel, collate_fn, save_label_mapping

def main():
    # Load dataset
    df = pd.read_csv("data/medical.csv")
    texts = df['text'].tolist()
    labels = df['label'].tolist()
    numeric_cols = df.columns.difference(['text', 'label'])
    numeric_feats = df[numeric_cols].values

    # Show label distribution
    print("Label counts:", pd.Series(labels).value_counts().to_dict())

    # Train/val split
    train_texts, val_texts, train_nums, val_nums, train_labels, val_labels = train_test_split(
        texts, numeric_feats, labels, test_size=0.2, random_state=42
    )

    # Tokenizer + datasets
    tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
    train_dataset = MultiInputDataset(train_texts, train_nums, train_labels, tokenizer)
    val_dataset = MultiInputDataset(val_texts, val_nums, val_labels, tokenizer)

    # Model
    model = MultiModalModel("distilbert-base-uncased", num_numeric_features=len(numeric_cols), num_labels=len(set(labels)))

    # ✅ Compatible TrainingArguments (no eval/save strategy)
    training_args = TrainingArguments(
        output_dir="./outputs",
        num_train_epochs=10,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        save_steps=500,
        logging_dir="./logs",
        logging_steps=50,
    )

    # Trainer (manual eval during training if version supports it)
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=collate_fn,
    )

    trainer.train()
    trainer.save_model("./outputs/best_model_final")

    # Save label mapping
    save_label_mapping(labels, "./outputs/best_model_final/label_mapping.json")

if __name__ == "__main__":
    main()
