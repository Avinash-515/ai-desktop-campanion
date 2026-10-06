import React, { useState, useEffect } from "react";
import { IconFiles, IconSearch, IconRefresh } from "./Icons";
import { desktopService } from "../services/desktopService";

export function FilesTab({ onAddToast, onAnalyzeDocument, onAskCompanion }) {
  const [currentDir, setCurrentDir] = useState("project");
  const [displayPath, setDisplayPath] = useState("");
  const [parentPath, setParentPath] = useState("");
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'

  const quickDirs = [
    { id: "project", label: "Project Root", icon: "📦" },
    { id: "documents", label: "Documents", icon: "📑" },
    { id: "desktop", label: "Desktop", icon: "🖥️" },
    { id: "downloads", label: "Downloads", icon: "📥" },
    { id: "home", label: "Home", icon: "🏠" }
  ];

  const loadDirectory = async (dirTarget) => {
    setIsLoading(true);
    try {
      const res = await desktopService.listDirectory(dirTarget);
      if (res && res.items) {
        setItems(res.items);
        setDisplayPath(res.currentPath || dirTarget);
        setParentPath(res.parentPath || "");
      }
    } catch (err) {
      onAddToast({ type: "error", title: "File Error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory(currentDir);
  }, [currentDir]);

  const handleSelectQuickDir = (dirId) => {
    setCurrentDir(dirId);
  };

  const handleOpenItem = async (item) => {
    if (item.isDirectory) {
      loadDirectory(item.path);
    } else {
      const res = await desktopService.openPath(item.path);
      onAddToast({
        type: res.success ? "success" : "error",
        title: item.name,
        message: res.success ? "Opened file in default application" : res.message
      });
    }
  };

  const handleShowInFolder = async (e, item) => {
    e.stopPropagation();
    await desktopService.showInFolder(item.path);
    onAddToast({
      type: "info",
      title: "File Location",
      message: `Revealed ${item.name} in File Explorer`
    });
  };

  const handleAnalyzeInDocTab = async (e, item) => {
    e.stopPropagation();
    try {
      const fileData = await desktopService.readFile(item.path);
      if (fileData.success) {
        onAnalyzeDocument({
          fileName: item.name,
          filePath: item.path,
          content: fileData.content
        });
        onAddToast({
          type: "success",
          title: "Document Loaded",
          message: `Loaded ${item.name} into Document Summarizer`
        });
      } else {
        onAddToast({ type: "error", title: "Read Error", message: fileData.message });
      }
    } catch (err) {
      onAddToast({ type: "error", title: "Error", message: err.message });
    }
  };

  const handleAskInChat = (e, item) => {
    e.stopPropagation();
    onAskCompanion(`What can you tell me about the file ${item.name} located at ${item.path}?`);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tab-page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Desktop Files Explorer</h2>
          <p className="page-subtitle">
            Inspect, open, and analyze files across your local folders and project workspace.
          </p>
        </div>

        <div className="quick-dirs-bar">
          {quickDirs.map((d) => (
            <button
              key={d.id}
              className={`quick-dir-chip ${currentDir === d.id ? "active" : ""}`}
              onClick={() => handleSelectQuickDir(d.id)}
            >
              <span>{d.icon}</span>
              <span>{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="files-toolbar">
        <div className="path-bar">
          {parentPath && (
            <button
              className="path-up-btn"
              onClick={() => loadDirectory(parentPath)}
              title="Go Up to Parent Directory"
            >
              ⬆ Up
            </button>
          )}
          <span className="current-path-text" title={displayPath}>
            {displayPath || "Current Directory"}
          </span>
          <button
            className="path-refresh-btn"
            onClick={() => loadDirectory(displayPath)}
            title="Refresh Directory"
          >
            <IconRefresh size={14} />
          </button>
        </div>

        <div className="files-controls-right">
          <div className="search-input-wrap">
            <IconSearch size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Filter files in directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              ≡
            </button>
            <button
              className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="files-loading-state">
          <div className="loading-spinner"></div>
          <span>Reading directory contents...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="files-empty-state">
          <span className="empty-icon">📂</span>
          <h3>No matching files found</h3>
          <p>Try clearing your search query or navigating to another folder.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="files-list-table">
          <div className="files-table-header">
            <span className="col-name">Name</span>
            <span className="col-size">Size</span>
            <span className="col-actions">Actions</span>
          </div>

          <div className="files-table-body">
            {filteredItems.map((item, idx) => (
              <div
                key={idx}
                className="files-table-row"
                onClick={() => handleOpenItem(item)}
              >
                <div className="col-name">
                  <span className="file-type-icon">{getFileIcon(item)}</span>
                  <span className="file-name-text">{item.name}</span>
                </div>

                <div className="col-size">
                  {item.isDirectory ? "Folder" : formatFileSize(item.size)}
                </div>

                <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                  {!item.isDirectory && (
                    <>
                      <button
                        className="file-action-btn"
                        onClick={(e) => handleAnalyzeInDocTab(e, item)}
                        title="Load and analyze in Document Summarizer"
                      >
                        📝 Summarize
                      </button>
                      <button
                        className="file-action-btn"
                        onClick={(e) => handleAskInChat(e, item)}
                        title="Ask Companion in Chat"
                      >
                        💬 Ask AI
                      </button>
                    </>
                  )}
                  <button
                    className="file-action-btn"
                    onClick={(e) => handleShowInFolder(e, item)}
                    title="Reveal in File Explorer"
                  >
                    📂 Reveal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="files-grid-container">
          {filteredItems.map((item, idx) => (
            <div
              key={idx}
              className="file-grid-card"
              onClick={() => handleOpenItem(item)}
            >
              <div className="file-grid-icon">{getFileIcon(item)}</div>
              <div className="file-grid-name" title={item.name}>
                {item.name}
              </div>
              <div className="file-grid-size">
                {item.isDirectory ? "Folder" : formatFileSize(item.size)}
              </div>
              <div className="file-grid-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="file-action-btn"
                  onClick={(e) => handleShowInFolder(e, item)}
                  title="Reveal in Explorer"
                >
                  Reveal
                </button>
                {!item.isDirectory && (
                  <button
                    className="file-action-btn"
                    onClick={(e) => handleAnalyzeInDocTab(e, item)}
                    title="Summarize document"
                  >
                    Summarize
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getFileIcon(item) {
  if (item.isDirectory) return "📁";
  const ext = (item.ext || "").toLowerCase();
  if (["js", "jsx", "ts", "tsx", "html", "css", "py", "c", "cpp", "rs"].includes(ext)) return "📜";
  if (["json", "yaml", "yml", "xml"].includes(ext)) return "⚙️";
  if (["md", "txt", "rtf", "doc", "docx", "pdf"].includes(ext)) return "📄";
  if (["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(ext)) return "🖼️";
  if (["zip", "tar", "gz", "7z"].includes(ext)) return "🗜️";
  return "📎";
}

function formatFileSize(bytes) {
  if (bytes === undefined || bytes === null || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
