.DEFAULT_GOAL := help
.PHONY: help install clean \
        start start-ios start-android start-web \
        lint lint-fix typecheck check \
        build-ios-preview build-ios-prod \
        build-android-preview build-android-prod \
        build-all-prod \
        submit-ios submit-android submit-all \
        ship-ios ship-android \
        build-list open-expo

# ── Colours ───────────────────────────────────────────────────────────────────
BOLD  := \033[1m
CYAN  := \033[36m
GREEN := \033[32m
RESET := \033[0m

# ─────────────────────────────────────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "$(BOLD)$(CYAN)Spirit Level — available targets$(RESET)"
	@echo ""
	@echo "$(BOLD)Setup$(RESET)"
	@echo "  install              Install all npm dependencies"
	@echo "  clean                Remove node_modules and Expo cache"
	@echo ""
	@echo "$(BOLD)Dev servers$(RESET)"
	@echo "  start                Start Expo dev server (Expo Go)"
	@echo "  start-ios            Start and open iOS simulator"
	@echo "  start-android        Start and open Android emulator"
	@echo "  start-web            Start web version"
	@echo ""
	@echo "$(BOLD)Code quality$(RESET)"
	@echo "  lint                 Run ESLint (zero warnings allowed)"
	@echo "  lint-fix             Run ESLint with auto-fix"
	@echo "  typecheck            Run tsc --noEmit"
	@echo "  check                lint + typecheck (run before committing)"
	@echo ""
	@echo "$(BOLD)EAS Builds$(RESET)"
	@echo "  build-ios-preview    Build iOS .ipa for internal distribution"
	@echo "  build-ios-prod       Build iOS production .ipa"
	@echo "  build-android-preview  Build Android .apk for sideloading"
	@echo "  build-android-prod   Build Android production .aab"
	@echo "  build-all-prod       Build both platforms (production)"
	@echo ""
	@echo "$(BOLD)EAS Submit$(RESET)"
	@echo "  submit-ios           Submit latest iOS build to App Store"
	@echo "  submit-android       Submit latest Android build to Play Store"
	@echo "  submit-all           Submit both platforms"
	@echo ""
	@echo "$(BOLD)Shortcuts$(RESET)"
	@echo "  ship-ios             build-ios-prod + submit-ios (--auto-submit)"
	@echo "  ship-android         build-android-prod + submit-android (--auto-submit)"
	@echo "  build-list           List recent EAS builds"
	@echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────────────────────────────────────
install:
	@echo "$(CYAN)Installing dependencies…$(RESET)"
	npm install --legacy-peer-deps

clean:
	@echo "$(CYAN)Cleaning node_modules and Expo cache…$(RESET)"
	rm -rf node_modules .expo dist
	@echo "$(GREEN)Done. Run 'make install' to reinstall.$(RESET)"

# ─────────────────────────────────────────────────────────────────────────────
# Dev servers
# ─────────────────────────────────────────────────────────────────────────────
start:
	npx expo start

start-ios:
	npx expo start --ios

start-android:
	npx expo start --android

start-web:
	npx expo start --web

# ─────────────────────────────────────────────────────────────────────────────
# Code quality
# ─────────────────────────────────────────────────────────────────────────────
lint:
	@echo "$(CYAN)Running ESLint…$(RESET)"
	npx eslint . --max-warnings 0

lint-fix:
	@echo "$(CYAN)Running ESLint with auto-fix…$(RESET)"
	npx eslint . --fix

typecheck:
	@echo "$(CYAN)Running TypeScript type check…$(RESET)"
	npx tsc --noEmit

check: lint typecheck
	@echo "$(GREEN)All checks passed.$(RESET)"

build-ios-preview:
	@echo "$(CYAN)Building iOS (preview)…$(RESET)"
	eas build --platform ios --profile preview --non-interactive

build-ios-prod:
	@echo "$(CYAN)Building iOS (production)…$(RESET)"
	eas build --platform ios --profile production --non-interactive

build-android-preview:
	@echo "$(CYAN)Building Android APK (preview)…$(RESET)"
	eas build --platform android --profile preview --non-interactive

build-android-prod:
	@echo "$(CYAN)Building Android (production)…$(RESET)"
	eas build --platform android --profile production --non-interactive

build-all-prod:
	@echo "$(CYAN)Building both platforms (production)…$(RESET)"
	eas build --platform all --profile production --non-interactive

# ─────────────────────────────────────────────────────────────────────────────
# EAS Submit
# ─────────────────────────────────────────────────────────────────────────────
submit-ios:
	@echo "$(CYAN)Submitting iOS to App Store…$(RESET)"
	eas submit --platform ios --latest

submit-android:
	@echo "$(CYAN)Submitting Android to Play Store…$(RESET)"
	eas submit --platform android --latest

submit-all:
	@echo "$(CYAN)Submitting both platforms…$(RESET)"
	eas submit --platform all --latest

# ─────────────────────────────────────────────────────────────────────────────
# Shortcuts
# ─────────────────────────────────────────────────────────────────────────────
ship-ios:
	@echo "$(CYAN)Building and submitting iOS…$(RESET)"
	eas build --platform ios --profile production --auto-submit --non-interactive

ship-android:
	@echo "$(CYAN)Building and submitting Android…$(RESET)"
	eas build --platform android --profile production --auto-submit --non-interactive

build-list:
	eas build:list
