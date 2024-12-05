class TokenRefreshHandler {
    static async refreshTokenIfNeeded(calendarSync) {
        if (this.needsRefresh(calendarSync.expires_at)) {
            const service = CalendarService.getCalendarService(
                calendarSync.provider,
                calendarSync
            );
            const newTokens = await service.refreshTokens(calendarSync.refresh_token);
            await CalendarModel.updateTokens(calendarSync.user_id, newTokens);
            return newTokens;
        }
        return null;
    }

    static needsRefresh(expiresAt) {
        const bufferTime = 5 * 60 * 1000; // 5 minutes
        return new Date(expiresAt).getTime() - bufferTime < Date.now();
    }
}

module.exports = TokenRefreshHandler;

