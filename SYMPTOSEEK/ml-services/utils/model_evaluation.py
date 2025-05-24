from sklearn.metrics import precision_recall_fscore_support, accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def evaluate_model(y_true, y_pred, classes):
    """Generate comprehensive evaluation metrics"""
    metrics = {}
    
    # Overall metrics
    metrics['accuracy'] = accuracy_score(y_true, y_pred)
    metrics['report'] = classification_report(y_true, y_pred)
    
    # Per-class metrics
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average=None, labels=classes)
    
    metrics['class_metrics'] = {
        cls: {
            'precision': prec,
            'recall': rec,
            'f1': f1
        } for cls, prec, rec, f1 in zip(classes, precision, recall, f1)
    }
    
    return metrics

def plot_confusion_matrix(y_true, y_pred, classes):
    """Generate visual confusion matrix"""
    cm = confusion_matrix(y_true, y_pred, labels=classes)
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', xticklabels=classes, yticklabels=classes)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig('confusion_matrix.png')
    plt.close()