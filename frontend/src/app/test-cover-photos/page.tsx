"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/atoms/button";

interface TestDataset {
  dataset_id: number;
  dataset_name: string;
  raw_cover_photo_url: string;
  url_tests: {
    stored_url_format?: {
      starts_with_http: boolean;
      contains_bucket: boolean;
      url_length: number;
    };
    regenerated_public_url?: string;
    signed_url?: string;
    manual_constructed_url?: string;
  };
  extracted_file_key?: string;
  file_key_extraction_error?: string;
}

interface TestResults {
  message?: string;
  total_datasets_with_covers: number;
  supabase_config?: {
    bucket: string;
    base_url: string;
  };
  datasets: TestDataset[];
  upload_test?: {
    message: string;
  };
  error?: string;
}

function ImageWithStatus({ src, alt }: { src: string; alt: string }) {
  const [imageStatus, setImageStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");

  useEffect(() => {
    setImageStatus("loading");
  }, [src]);

  return (
    <>
      {imageStatus === "loading" && (
        <div className="text-gray-500 text-sm">Loading...</div>
      )}
      {imageStatus === "error" && (
        <div className="text-red-500 text-sm">Failed to load</div>
      )}
      <img
        src={src}
        alt={alt}
        className={`max-w-full max-h-full object-contain ${
          imageStatus === "loaded" ? "block" : "hidden"
        }`}
        onLoad={() => setImageStatus("loaded")}
        onError={() => setImageStatus("error")}
      />
    </>
  );
}

export default function TestCoverPhotosPage() {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{
    original_filename?: string;
    content_type?: string;
    upload_steps?: Record<string, unknown>;
    error?: string;
  } | null>(null);

  const fetchTestData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/datasets/test-cover-photos`
      );
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error("Error fetching test data:", error);
      setTestResults({
        error: "Failed to fetch test data",
        total_datasets_with_covers: 0,
        supabase_config: { bucket: "", base_url: "" },
        datasets: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("test_image", selectedFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/datasets/test-upload-cover-photo`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      setUploadResults(data);
    } catch (error) {
      console.error("Error testing upload:", error);
      setUploadResults({ error: "Failed to test upload" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestData();
  }, []);

  if (isLoading && !testResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Cover Photos Debug Test</h1>
        <div className="text-center">Loading test data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Cover Photos Debug Test</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Purpose</h2>
        <p className="text-sm">
          This page tests cover photo retrieval and display to identify issues
          with:
        </p>
        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
          <li>Database storage of cover photo URLs</li>
          <li>URL generation and formats</li>
          <li>Image accessibility and CORS</li>
          <li>Frontend image loading</li>
        </ul>
      </div>

      <div className="mb-6">
        <Button onClick={fetchTestData} disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh Test Data"}
        </Button>
      </div>

      {testResults && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              Test Results
            </h2>
            {testResults.message && (
              <p className="text-blue-700 mb-2">{testResults.message}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Total Datasets with Covers:</strong>{" "}
                {testResults.total_datasets_with_covers}
              </div>
              {testResults.supabase_config && (
                <div>
                  <strong>Storage Bucket:</strong>{" "}
                  {testResults.supabase_config.bucket}
                </div>
              )}
            </div>
            {testResults.error && (
              <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
                <strong>Error:</strong> {testResults.error}
              </div>
            )}
          </div>

          {(testResults.datasets?.length || 0) === 0 ? (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
              <h3 className="font-semibold">
                No datasets with cover photos found
              </h3>
              <p>
                Try uploading a cover photo to a dataset first, then refresh
                this page.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {(testResults.datasets || []).map((dataset) => (
                <div key={dataset.dataset_id} className="border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Dataset: {dataset.dataset_name} (ID: {dataset.dataset_id})
                  </h2>

                  {/* Raw URL Info */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Stored URL:</h3>
                    <p className="text-sm font-mono break-all bg-white p-2 rounded border">
                      {dataset.raw_cover_photo_url}
                    </p>
                  </div>

                  {/* URL Format Tests */}
                  {dataset.url_tests?.stored_url_format && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold mb-2">
                        URL Format Analysis:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Starts with HTTP:</strong>{" "}
                          <span
                            className={
                              dataset.url_tests.stored_url_format
                                .starts_with_http
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {dataset.url_tests.stored_url_format
                              .starts_with_http
                              ? "✓"
                              : "✗"}
                          </span>
                        </div>
                        <div>
                          <strong>Contains Bucket:</strong>{" "}
                          <span
                            className={
                              dataset.url_tests.stored_url_format
                                .contains_bucket
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {dataset.url_tests.stored_url_format.contains_bucket
                              ? "✓"
                              : "✗"}
                          </span>
                        </div>
                        <div>
                          <strong>URL Length:</strong>{" "}
                          {dataset.url_tests.stored_url_format.url_length} chars
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Testing Section */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-4">Image Display Tests:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Original Stored URL */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">
                          Original Stored URL
                        </h4>
                        <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-2">
                          <ImageWithStatus
                            src={dataset.raw_cover_photo_url}
                            alt={`${dataset.dataset_name} - Original URL`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 break-all">
                          {dataset.raw_cover_photo_url}
                        </p>
                      </div>

                      {/* Regenerated Public URL */}
                      {dataset.url_tests?.regenerated_public_url && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            Regenerated Public URL
                          </h4>
                          <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-2">
                            <ImageWithStatus
                              src={dataset.url_tests.regenerated_public_url}
                              alt={`${dataset.dataset_name} - Regenerated`}
                            />
                          </div>
                          <p className="text-xs text-gray-500 break-all">
                            {dataset.url_tests.regenerated_public_url}
                          </p>
                        </div>
                      )}

                      {/* Signed URL */}
                      {dataset.url_tests?.signed_url && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Signed URL</h4>
                          <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-2">
                            <ImageWithStatus
                              src={dataset.url_tests.signed_url}
                              alt={`${dataset.dataset_name} - Signed`}
                            />
                          </div>
                          <p className="text-xs text-gray-500 break-all">
                            {dataset.url_tests.signed_url}
                          </p>
                        </div>
                      )}

                      {/* Manual Constructed URL */}
                      {dataset.url_tests?.manual_constructed_url && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            Manual Constructed URL
                          </h4>
                          <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-2">
                            <ImageWithStatus
                              src={dataset.url_tests.manual_constructed_url}
                              alt={`${dataset.dataset_name} - Manual`}
                            />
                          </div>
                          <p className="text-xs text-gray-500 break-all">
                            {dataset.url_tests.manual_constructed_url}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Information */}
                  {dataset.file_key_extraction_error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                      <h4 className="font-semibold">
                        File Key Extraction Error:
                      </h4>
                      <p className="text-sm">
                        {dataset.file_key_extraction_error}
                      </p>
                    </div>
                  )}

                  {Object.entries(dataset.url_tests || {}).map(
                    ([key, value]) => {
                      if (key.endsWith("_error")) {
                        return (
                          <div
                            key={key}
                            className="p-4 bg-red-50 text-red-700 rounded-lg"
                          >
                            <h4 className="font-semibold">
                              {key.replace("_", " ").toUpperCase()}:
                            </h4>
                            <p className="text-sm">{value as string}</p>
                          </div>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload test section */}
          <div className="mt-12 border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Test</h2>
            <p className="text-sm text-gray-600 mb-4">
              Test the cover photo upload process to see how URLs are generated.
            </p>

            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mb-2"
              />
              <Button
                onClick={testUpload}
                disabled={!selectedFile || isLoading}
                variant="outline"
              >
                {isLoading ? "Testing..." : "Test Upload"}
              </Button>
            </div>

            {uploadResults && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-4">Upload Test Results</h3>

                  {uploadResults.error ? (
                    <div className="p-3 bg-red-50 text-red-700 rounded">
                      <strong>Error:</strong> {uploadResults.error}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Original Filename:</strong>{" "}
                          {uploadResults.original_filename}
                        </div>
                        <div>
                          <strong>Content Type:</strong>{" "}
                          {uploadResults.content_type}
                        </div>
                      </div>

                      {uploadResults.upload_steps && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Upload Steps:</h4>

                          {/* Display URLs that were generated */}
                          {Object.entries(uploadResults.upload_steps).map(
                            ([step, result]) => {
                              const stepResult = result as Record<
                                string,
                                unknown
                              >;
                              if (step.includes("url") && stepResult.success) {
                                const imageUrl =
                                  stepResult.url ||
                                  stepResult.response ||
                                  stepResult.final_url;
                                if (imageUrl && typeof imageUrl === "string") {
                                  return (
                                    <div
                                      key={step}
                                      className="border rounded-lg p-4"
                                    >
                                      <h5 className="font-medium mb-2 capitalize">
                                        {step.replace(/_/g, " ")}
                                      </h5>
                                      <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-2">
                                        <ImageWithStatus
                                          src={imageUrl}
                                          alt={`Upload test - ${step}`}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500 break-all font-mono">
                                        {imageUrl}
                                      </p>
                                    </div>
                                  );
                                }
                              }
                              return null;
                            }
                          )}

                          {/* Raw JSON for debugging */}
                          <details className="mt-4">
                            <summary className="cursor-pointer text-sm font-medium text-gray-600">
                              Show Raw JSON Results
                            </summary>
                            <pre className="text-xs overflow-auto bg-white p-3 rounded border mt-2">
                              {JSON.stringify(uploadResults, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
