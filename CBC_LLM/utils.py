import torch, json
from torch.utils.data import Dataset
from transformers import AutoModel

class MultiInputDataset(Dataset):
    def __init__(self, texts, numeric_feats, labels, tokenizer, max_length=128):
        self.texts = texts
        self.numeric_feats = numeric_feats
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        numeric = torch.tensor(self.numeric_feats[idx], dtype=torch.float)
        label = torch.tensor(self.labels[idx], dtype=torch.long)
        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "numeric_feats": numeric,
            "labels": label,
        }

class MultiModalModel(torch.nn.Module):
    def __init__(self, transformer_model_name, num_numeric_features, num_labels=2):
        super().__init__()
        self.transformer = AutoModel.from_pretrained(transformer_model_name)
        hidden_size = self.transformer.config.hidden_size
        self.fc_numeric = torch.nn.Linear(num_numeric_features, 64)
        self.classifier = torch.nn.Linear(hidden_size + 64, num_labels)

    def forward(self, input_ids, attention_mask, numeric_feats, labels=None):
        outputs = self.transformer(input_ids=input_ids, attention_mask=attention_mask)
        pooled = outputs.last_hidden_state[:, 0]  # CLS
        numeric_out = torch.relu(self.fc_numeric(numeric_feats))
        concat = torch.cat((pooled, numeric_out), dim=1)
        logits = self.classifier(concat)

        loss = None
        if labels is not None:
            loss = torch.nn.CrossEntropyLoss()(logits, labels)
        return {"loss": loss, "logits": logits}

def collate_fn(batch):
    input_ids = torch.stack([x["input_ids"] for x in batch])
    attention_mask = torch.stack([x["attention_mask"] for x in batch])
    numeric_feats = torch.stack([x["numeric_feats"] for x in batch])
    labels = torch.stack([x["labels"] for x in batch])
    return {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "numeric_feats": numeric_feats,
        "labels": labels,
    }

def save_label_mapping(labels, path):
    unique_labels = sorted(set(labels))
    condition_names = {
        0: "Normal",
        1: "Anemia",
        2: "Infection",
        3: "Leukopenia",
        4: "Thrombocytopenia",
        5: "Polycythemia",
        6: "Eosinophilia"
    }
    mapping = {str(i): condition_names[i] for i in unique_labels}
    with open(path, "w") as f:
        json.dump(mapping, f)

def load_label_mapping(path):
    with open(path, "r") as f:
        return json.load(f)
