"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyActivity = void 0;
/**
 * Intelligent Rule-Based Activity Classifier for WorkTrack AI
 */
const classifyActivity = (appName, windowTitle, browserUrl) => {
    const app = (appName || '').toLowerCase();
    const title = (windowTitle || '').toLowerCase();
    const url = (browserUrl || '').toLowerCase();
    // 1. Meetings / Communication
    if (app.includes('zoom') ||
        app.includes('teams') ||
        app.includes('skype') ||
        app.includes('webex') ||
        app.includes('slack') ||
        app.includes('discord') ||
        title.includes('meet.google.com') ||
        url.includes('meet.google.com') ||
        url.includes('zoom.us') ||
        title.includes('huddle') ||
        title.includes('standup') ||
        title.includes('meeting')) {
        return 'Meetings';
    }
    // 2. Debugging
    if (title.includes('debug') ||
        title.includes('inspect') ||
        title.includes('developer tools') ||
        title.includes('sentry') ||
        title.includes('postman') ||
        app.includes('postman') ||
        url.includes('sentry.io')) {
        return 'Debugging';
    }
    // 3. Coding / Development
    if (app.includes('code') ||
        app.includes('vs code') ||
        app.includes('vscode') ||
        app.includes('visual studio') ||
        app.includes('sublime') ||
        app.includes('atom') ||
        app.includes('eclipse') ||
        app.includes('intellij') ||
        app.includes('webstorm') ||
        app.includes('pycharm') ||
        app.includes('android studio') ||
        app.includes('xcode') ||
        app.includes('terminal') ||
        app.includes('cmd') ||
        app.includes('powershell') ||
        app.includes('bash') ||
        app.includes('git') ||
        url.includes('github.com') ||
        url.includes('gitlab.com') ||
        url.includes('bitbucket.org') ||
        title.includes('github') ||
        url.includes('localhost') ||
        url.includes('127.0.0.1')) {
        return 'Coding';
    }
    // 4. Learning
    if (url.includes('leetcode.com') ||
        url.includes('hackerrank.com') ||
        url.includes('coursera.org') ||
        url.includes('udemy.com') ||
        url.includes('edx.org') ||
        url.includes('khanacademy.org') ||
        url.includes('w3schools.com') ||
        url.includes('freecodecamp') ||
        title.includes('tutorial') ||
        title.includes('learn') ||
        title.includes('course') ||
        title.includes('training') ||
        (url.includes('youtube.com') && (title.includes('tutorial') ||
            title.includes('course') ||
            title.includes('how to') ||
            title.includes('programming') ||
            title.includes('coding') ||
            title.includes('learn')))) {
        return 'Learning';
    }
    // 5. Documentation
    if (title.includes('documentation') ||
        title.includes('docs') ||
        title.includes('readme') ||
        url.includes('docs.microsoft') ||
        url.includes('developer.mozilla') ||
        url.includes('devdocs.io') ||
        url.includes('gitbook.com') ||
        title.includes('confluence') ||
        url.includes('confluence')) {
        return 'Documentation';
    }
    // 6. Research
    if (url.includes('google.com/search') ||
        url.includes('bing.com/search') ||
        url.includes('duckduckgo.com') ||
        url.includes('stackoverflow.com') ||
        title.includes('stack overflow') ||
        title.includes('research') ||
        title.includes('wikipedia') ||
        url.includes('wikipedia.org')) {
        return 'Research';
    }
    // 7. Entertainment
    if (url.includes('youtube.com') ||
        url.includes('netflix.com') ||
        url.includes('hulu.com') ||
        url.includes('twitch.tv') ||
        url.includes('spotify.com') ||
        url.includes('reddit.com') ||
        url.includes('instagram.com') ||
        url.includes('facebook.com') ||
        url.includes('twitter.com') ||
        url.includes('x.com') ||
        app.includes('spotify') ||
        app.includes('steam') ||
        app.includes('game')) {
        return 'Entertainment';
    }
    // 8. General Browsing
    if (app.includes('chrome') ||
        app.includes('firefox') ||
        app.includes('edge') ||
        app.includes('safari') ||
        app.includes('opera') ||
        app.includes('browser')) {
        return 'Browsing';
    }
    return 'Other';
};
exports.classifyActivity = classifyActivity;
