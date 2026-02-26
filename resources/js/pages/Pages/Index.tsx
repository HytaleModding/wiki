import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { BookOpenIcon, PlusIcon, EyeIcon, PencilIcon, Bars3Icon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface User {
  id: number;
  name: string;
  username: string;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  content?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  creator: User;
  order_index: number;
  parent_id?: string;
  children?: Page[];
}

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private' | 'unlisted';
  owner: User;
}

interface Props {
  mod: Mod;
  pages: Page[];
  canEdit: boolean;
}

export default function PagesIndex({ mod, pages, canEdit }: Props) {
  const [pagesList, setPagesList] = useState(pages);
  const [isDragDisabled, setIsDragDisabled] = useState(false);
  const [isDragModeEnabled, setIsDragModeEnabled] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit || !isDragModeEnabled) {
      return;
    }

    const { source, destination, draggableId } = result;

    // Find the dragged page
    const draggedPage = pagesList.find(p => p.id === draggableId);
    if (!draggedPage) return;

    // Get all pages with the same parent as the dragged page
    const sameLevelPages = pagesList
      .filter(p => p.parent_id === draggedPage.parent_id)
      .sort((a, b) => a.order_index - b.order_index);

    // Create a new array with the reordered pages
    const reorderedPages = Array.from(sameLevelPages);
    const [removed] = reorderedPages.splice(source.index, 1);
    reorderedPages.splice(destination.index, 0, removed);

    // Update order_index for all pages at this level
    const pagesToUpdate = reorderedPages.map((page, index) => ({
      id: page.id,
      parent_id: page.parent_id || null,
      order_index: index,
    }));

    setIsDragDisabled(true);

    try {
      // Send to backend using form submission
      router.post(`/mods/${mod.slug}/pages/reorder`, {
        pages: pagesToUpdate,
      }, {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          // Update local state with new order
          const newPagesList = pagesList.map(page => {
            const updatedPage = pagesToUpdate.find(p => p.id === page.id);
            return updatedPage ? { ...page, order_index: updatedPage.order_index } : page;
          });
          setPagesList(newPagesList);
        },
        onError: () => {
          // Revert to original state on error
          setPagesList(pages);
        },
        onFinish: () => {
          setIsDragDisabled(false);
        },
      });
    } catch (error) {
      console.error('Failed to update page order:', error);
      setPagesList(pages);
      setIsDragDisabled(false);
    }
  };

  const renderDraggablePage = (page: Page, index: number, level = 0, isLastAtLevel = false, ancestorLines: boolean[] = []) => (
    <Draggable
      key={page.id}
      draggableId={page.id}
      index={index}
      isDragDisabled={!canEdit || isDragDisabled || !isDragModeEnabled}
    >
      {(provided, snapshot) => (
        <tr
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group border-b border-gray-100 dark:border-gray-800 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
            snapshot.isDragging ? 'bg-blue-50 dark:bg-blue-900/50 shadow-lg' : ''
          } ${isDragModeEnabled && canEdit ? 'hover:bg-orange-50 dark:hover:bg-orange-900/20' : ''}`}
        >
          {/* Hierarchy + Title Column */}
          <td className="py-2 pr-4 w-1/2">
            <div className="flex items-center">
              {/* Hierarchy visualization */}
              <div className="flex items-center mr-2" style={{ minWidth: `${level * 16}px` }}>
                {level > 0 && (
                  <div className="flex items-center">
                    {/* Ancestor lines */}
                    {ancestorLines.map((hasLine, i) => (
                      <div
                        key={i}
                        className={`w-4 h-6 ${hasLine ? 'border-l border-gray-300 dark:border-gray-600' : ''}`}
                      />
                    ))}
                    {/* Current level connector */}
                    <div className="relative w-4 h-6">
                      <div className={`absolute left-0 top-0 w-3 h-3 border-l border-b border-gray-300 dark:border-gray-600 ${
                        isLastAtLevel ? 'border-b-gray-300 dark:border-b-gray-600' : ''
                      }`} />
                      {!isLastAtLevel && (
                        <div className="absolute left-0 top-3 bottom-0 w-0 border-l border-gray-300 dark:border-gray-600" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drag handle */}
              {canEdit && isDragModeEnabled && (
                <div
                  {...provided.dragHandleProps}
                  className="p-1 mr-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing opacity-60 group-hover:opacity-100"
                  title="Drag to reorder"
                >
                  <Bars3Icon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </div>
              )}

              {/* Page type indicator */}
              <div className={`w-2 h-2 rounded-full mr-2 shrink-0 ${
                page.children && page.children.length > 0
                  ? 'bg-blue-500'
                  : 'bg-gray-400'
              }`} />

              <div className="flex items-center min-w-0 flex-1">
                <a
                  href={`/mods/${mod.slug}/pages/${page.slug}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium truncate"
                >
                  {page.title}
                </a>
                {!page.published && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Draft
                  </Badge>
                )}
                {page.children && page.children.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    ({page.children.length})
                  </span>
                )}
              </div>
            </div>
          </td>

          <td className="py-2 px-2 text-center">
            <div className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${
              page.published ? 'bg-green-500' : 'bg-yellow-500'
            }`} title={page.published ? 'Published' : 'Draft'} />
          </td>

          <td className="py-2 px-2 text-sm text-gray-600 dark:text-gray-400 truncate">
            {page.creator.name}
          </td>

          <td className="py-2 px-2 text-sm text-gray-600 dark:text-gray-400">
            {formatDate(page.updated_at)}
          </td>

          <td className="py-2 pl-2">
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="ghost" asChild className="h-6 w-6 p-0">
                <a href={`/mods/${mod.slug}/pages/${page.slug}`} title="View page">
                  <EyeIcon className="h-3 w-3" />
                </a>
              </Button>
              {canEdit && (
                <Button size="sm" variant="ghost" asChild className="h-6 w-6 p-0">
                  <a href={`/mods/${mod.slug}/pages/${page.slug}/edit`} title="Edit page">
                    <PencilIcon className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </td>
        </tr>
      )}
    </Draggable>
  );

  const renderPageList = (pageList: Page[], parentId: string | null = null, level = 0, ancestorLines: boolean[] = []) => {
    const sortedPages = pageList.sort((a, b) => a.order_index - b.order_index);
    const droppableId = parentId ? `pages-${parentId}` : 'pages-root';

    return (
      <Droppable droppableId={droppableId} isDropDisabled={!isDragModeEnabled}>
        {(provided, snapshot) => (
          <tbody
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/30' : ''
            }`}
          >
            {sortedPages.map((page, index) => {
              const isLastAtLevel = index === sortedPages.length - 1;
              const newAncestorLines = level > 0 ? [...ancestorLines, !isLastAtLevel] : [];

              return (
                <React.Fragment key={page.id}>
                  {renderDraggablePage(page, index, level, isLastAtLevel, ancestorLines)}

                  {/* Render child pages */}
                  {page.children && page.children.length > 0 &&
                    renderPageList(page.children, page.id, level + 1, newAncestorLines)
                  }
                </React.Fragment>
              );
            })}
            {provided.placeholder && (
              <tr>
                <td colSpan={5}>{provided.placeholder}</td>
              </tr>
            )}
          </tbody>
        )}
      </Droppable>
    );
  };

  // Group pages by parent
  const rootPages = pagesList.filter(page => !page.parent_id);
  const childPages = pagesList.filter(page => page.parent_id);

  // Attach children to their parents
  const pagesWithChildren = rootPages.map(page => ({
    ...page,
    children: childPages.filter(child => child.parent_id === page.id),
  }));

  return (
    <AppLayout>
      <Head title={`All Pages - ${mod.name}`} />

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <a href={`/mods/${mod.slug}`} className="hover:text-gray-800 dark:hover:text-gray-200">
              {mod.name}
            </a>
            <span className="mx-2">›</span>
            <span>All Pages</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">All Pages</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Browse all documentation pages in this mod
                {isDragModeEnabled && ' - Drag and drop enabled'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {canEdit && (
                <Button
                  variant={isDragModeEnabled ? "default" : "outline"}
                  onClick={() => setIsDragModeEnabled(!isDragModeEnabled)}
                  disabled={isDragDisabled}
                >
                  <ArrowsUpDownIcon className="h-4 w-4 mr-2" />
                  {isDragModeEnabled ? 'Exit Reorder Mode' : 'Reorder Pages'}
                </Button>
              )}
              {canEdit && (
                <Button asChild>
                  <a href={`/mods/${mod.slug}/pages/create`}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Page
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {isDragModeEnabled && canEdit && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowsUpDownIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Reorder Mode Active</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Drag the handle icons to reorder pages</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDragModeEnabled(false)}
                className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
              >
                Exit
              </Button>
            </div>
          </div>
        )}

        {pagesList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpenIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No pages yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start documenting your mod by creating your first page
              </p>
              {canEdit && (
                <Button asChild>
                  <a href={`/mods/${mod.slug}/pages/create`}>
                    Create First Page
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {pagesList.length} Pages
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{rootPages.length} root pages</span>
                <span>{childPages.length} subpages</span>
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  {renderPageList(pagesWithChildren, null)}
                </table>
              </div>
            </DragDropContext>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
