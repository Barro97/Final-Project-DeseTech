import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { PreviewData } from "../../services/datasetService";

interface JSONPreviewProps {
  data: PreviewData[];
}

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
  [key: string]: JSONValue;
}
type JSONArray = JSONValue[];

interface CollapsibleJSONProps {
  value: JSONValue;
  depth?: number;
}

function CollapsibleJSON({ value, depth = 0 }: CollapsibleJSONProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const type = Array.isArray(value) ? "array" : typeof value;
  const isExpandable = type === "object" || type === "array";

  if (!isExpandable) {
    return (
      <span className={`json-${type}`}>
        {type === "string" ? `"${value}"` : String(value)}
      </span>
    );
  }

  const items = Array.isArray(value)
    ? value
    : Object.entries(value as JSONObject);
  const preview = Array.isArray(value)
    ? `Array(${items.length})`
    : `Object(${items.length})`;

  return (
    <div className="json-expandable">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 hover:bg-gray-100 rounded px-1"
      >
        {isExpandable && (
          <span className="text-gray-500">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        <span className="text-gray-700">{preview}</span>
      </button>

      {isExpanded && (
        <div className="pl-4 border-l border-gray-200 ml-2">
          {Array.isArray(value)
            ? items.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500">{index}: </span>
                  <CollapsibleJSON value={item} depth={depth + 1} />
                </div>
              ))
            : Object.entries(value as JSONObject).map(([key, val]) => (
                <div key={key} className="py-1">
                  <span className="text-gray-500">&ldquo;{key}&rdquo;: </span>
                  <CollapsibleJSON value={val} depth={depth + 1} />
                </div>
              ))}
        </div>
      )}
    </div>
  );
}

export function JSONPreview({ data }: JSONPreviewProps) {
  return (
    <div className="p-4 font-mono text-sm">
      <CollapsibleJSON value={data} />
    </div>
  );
}
