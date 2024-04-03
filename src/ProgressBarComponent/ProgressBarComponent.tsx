import { Card, Row, Progress, Button } from "antd";
import React, { useState } from "react";

const ProgressBarComponent: React.FC = () => {
  const [fetching, setFetching] = useState<boolean>(false);
  const [selectedFile, setFiles] = useState<File | undefined>(undefined);
  const [uploadPercentage, setUploadPercentage] = useState<number>(0);
  const [allowUpload, setAllowUpload] = useState<boolean>(true);

  const handleSelecteFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event);
    setAllowUpload(false);
    if (event.target.files) {
      setFiles(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData();
    if (selectedFile) {
      data.append("file", selectedFile);
      let url = "http://localhost:8080/upload/local";
      const eventSource = new EventSource("http://localhost:8080/progress");
      let guidValue: string | null = null;

      eventSource.addEventListener("GUI_ID", (event) => {
        guidValue = JSON.parse(event.data);
        console.log(`Guid from server: ${guidValue}`);
        if (guidValue) {
          data.append("guid", guidValue);
          eventSource.addEventListener(guidValue, (event) => {
            const result = JSON.parse(event.data);
            if (uploadPercentage !== result) {
              setUploadPercentage(result);
            }
            if (result === 100) {
              eventSource.close();
            }
          });
          uploadToServer(url, data);
        }
      });

      eventSource.onerror = (event: any) => {
        if (event.target.readyState === EventSource.CLOSED) {
          console.log("SSE closed (" + event.target.readyState + ")");
        }
        setUploadPercentage(0);
        eventSource.close();
      };

      eventSource.onopen = () => {
        console.log("connection opened");
      };
    }
  };

  const uploadToServer = (url: string, data: FormData) => {
    setFetching(true);
    console.log("Upload File");
    let currentFile = selectedFile;
    console.log(currentFile);

    const requestOptions: RequestInit = {
      method: "POST",
      mode: "no-cors",
      body: data,
    };
    fetch(url, requestOptions).then(() => setAllowUpload(true));
  };

  return (
    <div>
      <Card title="Live Progress Indicator">
        <Row justify="center">
          <Progress type="circle" percent={(uploadPercentage / 100) * 100} />
        </Row>
        <br></br>
        <Row justify="center">
          {fetching &&
            (uploadPercentage / 100) * 100 !== 100 &&
            `Uploading [${(uploadPercentage / 100) * 100}/100]%`}
          {(uploadPercentage / 100) * 100 === 100 &&
            "File Uploaded Successfully"}
        </Row>
        <br />
        <Row justify="center">
          <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleSelecteFile} />
            <Button
              type="primary"
              htmlType="submit"
              disabled={allowUpload}
            >
              Upload
            </Button>
          </form>
        </Row>
      </Card>
    </div>
  );
}

export default ProgressBarComponent;