type DownloadTask = {
  id: string;
  url: string;
  onProgress: (percent: number) => void;
  onComplete: (blob: Blob) => void;
  onError: (error: any) => void;
  retries: number;
};

class DownloadQueue {
  private queue: DownloadTask[] = [];
  private activeCount = 0;
  private maxConcurrent = 1; // Strict sequential loading to avoid 429
  private processingDelay = 500; // ms delay between requests

  enqueue(
    id: string,
    url: string,
    onProgress: (percent: number) => void,
    onComplete: (blob: Blob) => void,
    onError: (error: any) => void
  ) {
    this.queue.push({ id, url, onProgress, onComplete, onError, retries: 0 });
    this.processNext();
    
    // Return a cancel function
    return () => {
      this.queue = this.queue.filter(t => t.id !== id);
    };
  }

  private processNext() {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.activeCount++;
    
    // Add small delay to be gentle on the API
    setTimeout(() => {
      this.startDownload(task);
    }, this.processingDelay);
  }

  private startDownload(task: DownloadTask) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", task.url, true);
    xhr.responseType = "blob";

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        task.onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        task.onComplete(xhr.response);
        this.activeCount--;
        this.processNext();
      } else if (xhr.status === 429 && task.retries < 3) {
        // Too Many Requests - Retry with backoff
        // console.log(`Rate limited for ${task.id}, retrying...`);
        this.activeCount--;
        task.retries++;
        // Re-enqueue at the front after delay
        setTimeout(() => {
          this.queue.unshift(task);
          this.processNext();
        }, 1000 * Math.pow(2, task.retries)); // 2s, 4s, 8s
      } else {
        task.onError(`HTTP ${xhr.status}`);
        this.activeCount--;
        this.processNext();
      }
    };

    xhr.onerror = () => {
      if (task.retries < 3) {
        this.activeCount--;
        task.retries++;
        setTimeout(() => {
          this.queue.unshift(task);
          this.processNext();
        }, 1000 * Math.pow(2, task.retries));
      } else {
        task.onError("Network error");
        this.activeCount--;
        this.processNext();
      }
    };

    xhr.send();
  }
}

export const downloadQueue = new DownloadQueue();
