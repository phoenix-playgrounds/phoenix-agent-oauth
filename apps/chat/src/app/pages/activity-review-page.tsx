import { ArrowLeft, Loader2, Search, Settings, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  ActivityStoryList,
  ActivityStoryDetailPanel,
} from '../activity-review-panel';
import { ChatSettingsModal } from '../chat/chat-settings-modal';
import { useActivityReviewData, type ActivityReviewData } from '../use-activity-review-data';
import { RIGHT_SIDEBAR_WIDTH_PX, PANEL_HEADER_MIN_HEIGHT_PX } from '../layout-constants';
import {
  BUTTON_ICON_ACCENT_SM,
  INPUT_SEARCH,
  SEARCH_ICON_POSITION,
  SEARCH_ROW_WRAPPER,
  CLEAR_BUTTON_POSITION,
  SIDEBAR_HEADER,
} from '../ui-classes';
import { ThemeToggle } from '../theme-toggle';
import { shouldHideThemeSwitch } from '../embed-config';
import { CHAT_STATES } from '../chat/chat-state';

export type { ActivityReviewData };

export function ActivityReviewPage() {
  const { activityId: routeActivityId, storyId: routeStoryId, activityStoryId } = useParams<{
    activityId?: string;
    storyId?: string;
    activityStoryId?: string;
  }>();

  const {
    loading,
    error,
    activityStories,
    filteredStories,
    selectedStory,
    selectedIndexSafe,
    typeFilter,
    activitySearchQuery,
    setActivitySearchQuery,
    detailSearchQuery,
    setDetailSearchQuery,
    settingsOpen,
    setSettingsOpen,
    brainButtonRef,
    copyAnimating,
    copyTooltipAnchor,
    handleSelectStory,
    runCopyActivityWithAnimation,
    closeSettings,
    isFollowing,
    setIsFollowing,
    liveResponseText,
    brainState,
  } = useActivityReviewData({
    activityId: routeActivityId,
    storyId: routeStoryId,
    activityStoryId,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-violet-950/10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-violet-400" />
          <span className="text-sm text-muted-foreground">Loading activities…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-violet-950/10">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <p className="text-sm text-destructive">{error}</p>
          <Link
            to="/"
            className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-background via-background to-violet-950/10">
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        <aside
          className="flex flex-col flex-shrink-0 bg-gradient-to-br from-background via-background to-purple-950/5 border-r border-violet-500/20 transition-all duration-300 overflow-hidden"
          style={{ width: RIGHT_SIDEBAR_WIDTH_PX, minWidth: 0 }}
        >
          {/* Header: nav + settings/theme + search */}
          <div
            className={`${SIDEBAR_HEADER} flex flex-col shrink-0 min-w-0`}
            style={{ minHeight: PANEL_HEADER_MIN_HEIGHT_PX }}
          >
            <div className="flex items-center gap-2 min-w-0 mb-2">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1 -m-1 hover:bg-violet-500/10 transition-colors"
                aria-label="Back to chat"
              >
                <ArrowLeft className="size-4 shrink-0" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="flex items-center gap-1 ml-auto shrink-0">
                <button
                  type="button"
                  className={BUTTON_ICON_ACCENT_SM}
                  title="Settings"
                  aria-label="Settings"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="size-3.5 sm:size-4" />
                </button>
                {!shouldHideThemeSwitch() && <ThemeToggle />}
              </div>
            </div>
            <div className={SEARCH_ROW_WRAPPER}>
              <Search className={SEARCH_ICON_POSITION} aria-hidden />
              <input
                type="text"
                value={activitySearchQuery}
                onChange={(e) => setActivitySearchQuery(e.target.value)}
                placeholder="Search stories..."
                className={INPUT_SEARCH}
                aria-label="Search stories"
              />
              {activitySearchQuery ? (
                <button
                  type="button"
                  onClick={() => setActivitySearchQuery('')}
                  className={CLEAR_BUTTON_POSITION}
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Follow Activity pill — own row with animated live dot */}
          <div className="px-3 py-2 flex items-center gap-2 border-b border-border/40 shrink-0">
            <button
              id="follow-activity-toggle"
              type="button"
              aria-pressed={isFollowing}
              onClick={() => setIsFollowing((v) => !v)}
              className={`
                flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-medium
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40
                ${isFollowing
                  ? 'bg-violet-500/15 border-violet-500/40 text-violet-300 shadow-sm shadow-violet-500/20'
                  : 'bg-muted/40 border-border/50 text-muted-foreground hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/30'
                }
              `}
            >
              {/* Animated live dot */}
              <span className="relative flex size-2 shrink-0" aria-hidden>
                {isFollowing ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-violet-500" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full size-2 bg-muted-foreground/40" />
                )}
              </span>
              Follow activity
            </button>
            {isFollowing && (
              <span className="text-[10px] text-violet-400/80 italic select-none">Live</span>
            )}
          </div>

          <ActivityStoryList
            stories={filteredStories}
            selectedIndex={selectedIndexSafe}
            onSelectStory={handleSelectStory}
            emptyMessage={
              activityStories.length === 0
                ? 'No stories yet.'
                : activitySearchQuery.trim()
                  ? 'No stories match your search.'
                  : typeFilter.length > 0
                    ? 'No matching stories for the selected filters.'
                    : 'No stories.'
            }
          />
        </aside>
        <ActivityStoryDetailPanel
          selectedStory={selectedStory}
          detailSearchQuery={detailSearchQuery}
          onDetailSearchChange={setDetailSearchQuery}
          copyAnimating={copyAnimating}
          copyTooltipAnchor={copyTooltipAnchor}
          brainButtonRef={brainButtonRef}
          onCopyClick={() => void runCopyActivityWithAnimation()}
          liveResponseText={liveResponseText}
          brainState={brainState}
          totalStories={activityStories.length}
          completedStories={brainState === 'working' ? Math.max(0, activityStories.length - 1) : activityStories.length}
        />
      </div>
      <ChatSettingsModal
        open={settingsOpen}
        onClose={closeSettings}
        state={CHAT_STATES.AUTHENTICATED}
        onStartAuth={() => undefined}
        onReauthenticate={() => undefined}
        onLogout={() => undefined}
      />
    </div>
  );
}
