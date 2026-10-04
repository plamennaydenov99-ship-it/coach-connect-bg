import type { Lang } from '@/context/LanguageContext';
import type { t } from '@/lib/translations';

type Key = keyof (typeof t)['en'];

/** Club portals reuse coach pages; these keys say "members" instead of "clients". */
export const clubLabelOverrides: Record<Lang, Partial<Record<Key, string>>> = {
  en: {
    portal_clients: 'Members', dash_kpi_active: 'Active members', dash_pipeline: 'Member pipeline', crm_clients: 'Members', dash_clients: 'Members', crm_new_client: 'New member',
    crm_empty_title: 'No members yet', crm_empty_body: 'Add your first member to start tracking classes, tasks and notes.',
    crm_no_match: 'No members match your search.', crm_create: 'Create member', crm_archive: 'Archive member',
    crm_unarchive: 'Restore member', crm_delete: 'Delete member', crm_delete_title: 'Delete this member?',
    crm_delete_body: 'This permanently removes the member with their sessions, tasks, notes and history.',
    crm_client_created: 'Member created', crm_not_found: 'Member not found.', cal_client: 'Member',
    cal_search_client: 'Search members', cal_new_client_inline: 'New member', cal_new_client_name: 'Member name',
    cal_no_clients: 'No members found.', cal_pick_client: 'Choose a member', cal_open_client: 'Open member',
  },
  bg: {
    portal_clients: 'Членове', dash_kpi_active: 'Активни членове', dash_pipeline: 'Етапи на членовете', crm_clients: 'Членове', dash_clients: 'Членове', crm_new_client: 'Нов член',
    crm_empty_title: 'Още нямаш членове', crm_empty_body: 'Добави първия си член, за да следиш тренировки, задачи и бележки.',
    crm_no_match: 'Няма членове, които отговарят на търсенето ти.', crm_create: 'Създай член', crm_archive: 'Архивирай члена',
    crm_unarchive: 'Възстанови члена', crm_delete: 'Изтрий члена', crm_delete_title: 'Да изтрия ли този член?',
    crm_delete_body: 'Това премахва завинаги члена заедно с тренировките, задачите, бележките и историята.',
    crm_client_created: 'Членът е създаден', crm_not_found: 'Членът не е намерен.', cal_client: 'Член',
    cal_search_client: 'Търси членове', cal_new_client_inline: 'Нов член', cal_new_client_name: 'Име на члена',
    cal_no_clients: 'Няма намерени членове.', cal_pick_client: 'Избери член', cal_open_client: 'Отвори члена',
  },
  fr: {
    portal_clients: 'Membres', dash_kpi_active: 'Membres actifs', dash_pipeline: 'Parcours des membres', crm_clients: 'Membres', dash_clients: 'Membres', crm_new_client: 'Nouveau membre',
    crm_empty_title: 'Aucun membre pour le moment', crm_empty_body: 'Ajoutez votre premier membre pour suivre les cours, tâches et notes.',
    crm_no_match: 'Aucun membre ne correspond à votre recherche.', crm_create: 'Créer le membre', crm_archive: 'Archiver le membre',
    crm_unarchive: 'Restaurer le membre', crm_delete: 'Supprimer le membre', crm_delete_title: 'Supprimer ce membre ?',
    crm_delete_body: 'Cela supprime définitivement le membre ainsi que ses séances, tâches, notes et historique.',
    crm_client_created: 'Membre créé', crm_not_found: 'Membre introuvable.', cal_client: 'Membre',
    cal_search_client: 'Rechercher des membres', cal_new_client_inline: 'Nouveau membre', cal_new_client_name: 'Nom du membre',
    cal_no_clients: 'Aucun membre trouvé.', cal_pick_client: 'Choisissez un membre', cal_open_client: 'Ouvrir le membre',
  },
};
