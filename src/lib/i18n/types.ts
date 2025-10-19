import { SupportedLanguage } from "./config";

/**
 * Type-safe translation keys organized by namespace
 * This will be expanded as we extract more strings
 */
export type TranslationKeys = {
  // Common namespace
  common: {
    buttons: {
      save: string;
      cancel: string;
      delete: string;
      edit: string;
      create: string;
      submit: string;
      search: string;
      loading: string;
      retry: string;
      back: string;
      next: string;
      previous: string;
      close: string;
      confirm: string;
      apply: string;
    };
    status: {
      success: string;
      error: string;
      warning: string;
      info: string;
      loading: string;
      pending: string;
      completed: string;
      failed: string;
      active: string;
      inactive: string;
    };
    navigation: {
      home: string;
      dashboard: string;
      profile: string;
      settings: string;
      logout: string;
      login: string;
      signup: string;
      about: string;
      contact: string;
      help: string;
      admin: string;
    };
    actions: {
      view_details: string;
      manage: string;
      share: string;
      copy: string;
      download: string;
      upload: string;
      refresh: string;
      filter: string;
      sort: string;
      export: string;
      import: string;
    };
    time: {
      now: string;
      today: string;
      yesterday: string;
      tomorrow: string;
      minutes_ago: string;
      hours_ago: string;
      days_ago: string;
      weeks_ago: string;
      months_ago: string;
      years_ago: string;
    };
  };

  // Auth namespace
  auth: {
    login: {
      title: string;
      subtitle: string;
      email_label: string;
      email_placeholder: string;
      password_label: string;
      password_placeholder: string;
      remember_me: string;
      forgot_password: string;
      submit_button: string;
      no_account: string;
      signup_link: string;
      oauth_separator: string;
      google_login: string;
      discord_login: string;
    };
    signup: {
      title: string;
      subtitle: string;
      name_label: string;
      name_placeholder: string;
      email_label: string;
      email_placeholder: string;
      password_label: string;
      password_placeholder: string;
      password_confirm_label: string;
      password_confirm_placeholder: string;
      terms_accept: string;
      terms_link: string;
      privacy_link: string;
      submit_button: string;
      has_account: string;
      login_link: string;
    };
    logout: {
      button: string;
      confirmation: string;
      success_message: string;
    };
    errors: {
      invalid_credentials: string;
      email_not_verified: string;
      account_exists: string;
      weak_password: string;
      network_error: string;
      server_error: string;
    };
  };

  // Navigation namespace
  navigation: {
    main_menu: {
      dashboard: string;
      games: string;
      events: string;
      teams: string;
      profile: string;
      settings: string;
      admin: string;
    };
    user_menu: {
      profile: string;
      preferences: string;
      security: string;
      logout: string;
    };
    breadcrumbs: {
      home: string;
      current_page: string;
    };
  };

  // Games namespace
  games: {
    listing: {
      title: string;
      subtitle: string;
      search_placeholder: string;
      filter_button: string;
      no_results: string;
      loading: string;
      error: string;
    };
    details: {
      players_label: string;
      playtime_label: string;
      complexity_label: string;
      age_label: string;
      publisher_label: string;
      year_label: string;
      description_label: string;
      apply_button: string;
      share_button: string;
    };
    form: {
      create_title: string;
      edit_title: string;
      name_label: string;
      name_placeholder: string;
      description_label: string;
      description_placeholder: string;
      min_players_label: string;
      max_players_label: string;
      optimal_players_label: string;
      playtime_label: string;
      complexity_label: string;
      age_rating_label: string;
      publisher_label: string;
      year_label: string;
      submit_button: string;
      cancel_button: string;
    };
  };

  // Events namespace
  events: {
    listing: {
      title: string;
      subtitle: string;
      upcoming_title: string;
      past_title: string;
      search_placeholder: string;
      filter_button: string;
      no_results: string;
      loading: string;
      error: string;
    };
    details: {
      date_label: string;
      time_label: string;
      location_label: string;
      organizer_label: string;
      status_label: string;
      participants_label: string;
      description_label: string;
      register_button: string;
      unregister_button: string;
      share_button: string;
    };
    form: {
      create_title: string;
      edit_title: string;
      name_label: string;
      name_placeholder: string;
      description_label: string;
      description_placeholder: string;
      date_label: string;
      time_label: string;
      location_label: string;
      max_participants_label: string;
      registration_deadline_label: string;
      submit_button: string;
      cancel_button: string;
    };
  };

  // Teams namespace
  teams: {
    listing: {
      title: string;
      subtitle: string;
      my_teams_title: string;
      discover_title: string;
      search_placeholder: string;
      filter_button: string;
      no_results: string;
      loading: string;
      error: string;
    };
    details: {
      members_label: string;
      owner_label: string;
      created_label: string;
      description_label: string;
      join_button: string;
      leave_button: string;
      manage_button: string;
      share_button: string;
    };
    form: {
      create_title: string;
      edit_title: string;
      name_label: string;
      name_placeholder: string;
      description_label: string;
      description_placeholder: string;
      visibility_label: string;
      submit_button: string;
      cancel_button: string;
    };
  };

  // Player namespace
  player: {
    dashboard: {
      title: string;
      subtitle: string;
      welcome_message: string;
      quick_actions_title: string;
      sessions_title: string;
      teams_title: string;
      events_title: string;
      profile_completion_title: string;
      profile_completion_message: string;
      complete_profile_button: string;
    };
    profile: {
      title: string;
      basic_info_title: string;
      gaming_preferences_title: string;
      availability_title: string;
      bio_title: string;
      edit_button: string;
      save_button: string;
      cancel_button: string;
      name_label: string;
      email_label: string;
      location_label: string;
      preferred_games_label: string;
      playstyle_label: string;
      availability_label: string;
      bio_label: string;
    };
    settings: {
      title: string;
      language_title: string;
      notifications_title: string;
      privacy_title: string;
      account_title: string;
      language_description: string;
      notifications_description: string;
      privacy_description: string;
      account_description: string;
      change_password_button: string;
      delete_account_button: string;
      export_data_button: string;
    };
  };

  // Forms namespace
  forms: {
    validation: {
      required: string;
      email_invalid: string;
      password_too_short: string;
      password_no_match: string;
      name_too_short: string;
      url_invalid: string;
      number_invalid: string;
      date_invalid: string;
      file_too_large: string;
      file_invalid_type: string;
    };
    fields: {
      name: string;
      email: string;
      password: string;
      password_confirm: string;
      description: string;
      location: string;
      date: string;
      time: string;
      website: string;
      phone: string;
      tags: string;
      category: string;
    };
  };

  // Errors namespace
  errors: {
    not_found: {
      title: string;
      message: string;
      action_button: string;
    };
    unauthorized: {
      title: string;
      message: string;
      login_button: string;
    };
    server_error: {
      title: string;
      message: string;
      retry_button: string;
    };
    network_error: {
      title: string;
      message: string;
      retry_button: string;
    };
    validation_error: {
      title: string;
      message: string;
      fix_button: string;
    };
  };
};

/**
 * Helper type for nested translation keys
 */
export type NestedTranslationKey<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends string
        ? `${K extends string ? K : never}`
        : `${K extends string ? K : never}.${NestedTranslationKey<T[K]>}`;
    }[keyof T]
  : never;

/**
 * Import auto-generated translation types
 * These types are automatically generated from JSON translation files
 * Run "pnpm i18n:generate-types" to regenerate after adding new keys
 */
export type {
  AdminTranslationKeys,
  AllTranslationKeys,
  AuthTranslationKeys,
  CampaignsTranslationKeys,
  CollaborationTranslationKeys,
  CommonTranslationKeys,
  ConsentTranslationKeys,
  EventsTranslationKeys,
  GamesTranslationKeys,
  GamesystemsTranslationKeys,
  GmTranslationKeys,
  InboxTranslationKeys,
  MembershipTranslationKeys,
  OpsTranslationKeys,
  PlayerTranslationKeys,
  ProfileTranslationKeys,
  RolesTranslationKeys,
  SettingsTranslationKeys,
  SocialTranslationKeys,
  TeamsTranslationKeys,
} from "./generated-types";

/**
 * Language information
 */
export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  isRTL: boolean;
}

/**
 * User language preferences
 */
export interface UserLanguagePreferences {
  preferredLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  autoDetectEnabled: boolean;
}
