import { useState } from 'react';
import { useParsingStore } from '../../stores/parsingStore';
import { HighlightedForm } from './HighlightedForm';
import type { DecisionNode } from '../../types/parsing';
import { conclusionToString } from '../../types/parsing';
import { useLanguageStore } from '../../stores/languageStore';

interface TreeNodeProps {
  node: DecisionNode;
  depth: number;
  isOnPath: boolean;
  onNodeClick: (node: DecisionNode) => void;
  selectedNode: DecisionNode | null;
  input: string;
}

function TreeNode({ node, depth, isOnPath, onNodeClick, selectedNode, input }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2 || isOnPath);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNode?.ruleId === node.ruleId;

  const getBgColor = () => {
    if (isSelected) return 'bg-blue-100 dark:bg-blue-800 border-blue-500';
    if (node.matched && isOnPath) return 'bg-green-50 dark:bg-green-900/30 border-green-500';
    if (node.matched) return 'bg-green-50/50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
    return 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
  };

  const getIconColor = () => {
    if (node.matched && isOnPath) return 'bg-green-500 text-white';
    if (node.matched) return 'bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100';
    return 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300';
  };

  if (node.ruleId === 'root') {
    return (
      <div className="space-y-2">
        {node.children.map((child, idx) => (
          <TreeNode
            key={idx}
            node={child}
            depth={0}
            isOnPath={child.matched}
            onNodeClick={onNodeClick}
            selectedNode={selectedNode}
            input={input}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connection line */}
      {depth > 0 && (
        <div
          className={`absolute left-4 -top-2 w-0.5 h-2 ${
            isOnPath ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
      )}

      <div
        className={`rounded-lg border-2 ${getBgColor()} p-3 cursor-pointer transition-all hover:shadow-md`}
        onClick={() => onNodeClick(node)}
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex items-center gap-3">
          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="flex-shrink-0 w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {expanded ? '−' : '+'}
            </button>
          )}

          {/* Match indicator */}
          <div
            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getIconColor()}`}
          >
            {node.matched ? '✓' : '✗'}
          </div>

          {/* Rule info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {node.ruleId}
            </div>
            {node.matched && node.highlights.length > 0 && (
              <div className="mt-1">
                <HighlightedForm form={input} highlights={node.highlights} />
              </div>
            )}
          </div>

          {/* Conclusion */}
          {node.matched && Object.keys(node.conclusion).length > 0 && (
            <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded">
              {conclusionToString(node.conclusion)}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-2 space-y-2 relative">
          {/* Vertical line connecting children */}
          <div
            className={`absolute left-4 top-0 w-0.5 h-full ${
              isOnPath ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            style={{ marginLeft: depth * 24 + 16 }}
          />

          {node.children.map((child, idx) => (
            <TreeNode
              key={idx}
              node={child}
              depth={depth + 1}
              isOnPath={isOnPath && child.matched}
              onNodeClick={onNodeClick}
              selectedNode={selectedNode}
              input={input}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DecisionTreeView() {
  const { currentResult } = useParsingStore();
  const { getCurrentLanguage } = useLanguageStore();
  const currentLang = getCurrentLanguage();
  const [selectedNode, setSelectedNode] = useState<DecisionNode | null>(null);

  if (!currentResult) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Enter a word above to see the decision tree
      </div>
    );
  }

  const tree = currentResult.decisionTree;

  return (
    <div className="space-y-6">
      {/* Input display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <span
          className={`text-3xl ${
            currentLang?.script === 'syriac' ? 'font-syriac' : 'font-hebrew'
          }`}
          dir={currentLang?.direction || 'rtl'}
        >
          {currentResult.input}
        </span>

        {currentResult.success && (
          <div className="mt-4 text-lg text-gray-700 dark:text-gray-300">
            {conclusionToString(currentResult.conclusion)}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Matched (on path)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-300 dark:bg-green-700" />
          <span className="text-gray-600 dark:text-gray-400">Matched</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="text-gray-600 dark:text-gray-400">Not matched</span>
        </div>
      </div>

      {/* Decision tree */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 overflow-auto">
        {tree.children.length > 0 ? (
          <TreeNode
            node={tree}
            depth={0}
            isOnPath={true}
            onNodeClick={setSelectedNode}
            selectedNode={selectedNode}
            input={currentResult.input}
          />
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="mb-2">No rule-based parsing available for this input.</p>
            <p className="text-sm">
              {currentResult.sedraResults && currentResult.sedraResults.length > 0
                ? 'SEDRA API provided morphological analysis (see Step-by-Step view).'
                : 'Try importing verb tables or check the SEDRA API connection.'}
            </p>
          </div>
        )}
      </div>

      {/* Show matched rules count */}
      {tree.children.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {tree.children.filter(c => c.matched).length} of {tree.children.length} entry rules matched
        </div>
      )}

      {/* Selected node details */}
      {selectedNode && selectedNode.ruleId !== 'root' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">
            Rule Details: {selectedNode.ruleId}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status: </span>
              <span className={`font-medium ${selectedNode.matched ? 'text-green-600' : 'text-red-600'}`}>
                {selectedNode.matched ? 'Matched' : 'Not Matched'}
              </span>
            </div>

            {selectedNode.matched && Object.keys(selectedNode.conclusion).length > 0 && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Conclusion: </span>
                <span className="font-medium">{conclusionToString(selectedNode.conclusion)}</span>
              </div>
            )}

            {selectedNode.children.length > 0 && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Next rules: </span>
                <span className="font-medium">{selectedNode.children.length}</span>
              </div>
            )}
          </div>

          {selectedNode.matched && selectedNode.highlights.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <span className="text-gray-500 dark:text-gray-400">Highlighted: </span>
              <HighlightedForm
                form={currentResult.input}
                highlights={selectedNode.highlights}
                showLabels={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
