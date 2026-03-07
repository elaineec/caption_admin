export type ResourceMode = 'read' | 'update' | 'crud'

export type AdminResource = {
  slug: string
  title: string
  description: string
  mode: ResourceMode
  tableCandidates: string[]
  supportsImageUpload?: boolean
}

export const ADMIN_RESOURCES: AdminResource[] = [
  {
    slug: 'users',
    title: 'Users / Profiles',
    description: 'Read profiles for access and identity checks.',
    mode: 'read',
    tableCandidates: ['profiles'],
  },
  {
    slug: 'images',
    title: 'Images',
    description: 'Create, read, update, delete image rows and upload new files.',
    mode: 'crud',
    tableCandidates: ['images'],
    supportsImageUpload: true,
  },
  {
    slug: 'humor-flavors',
    title: 'Humor Flavors',
    description: 'Read flavor taxonomies used by prompt and ranking systems.',
    mode: 'read',
    tableCandidates: ['humor_flavors'],
  },
  {
    slug: 'humor-flavor-steps',
    title: 'Humor Flavor Steps',
    description: 'Read humor flavor progression steps.',
    mode: 'read',
    tableCandidates: ['humor_flavor_steps'],
  },
  {
    slug: 'humor-mix',
    title: 'Humor Mix',
    description: 'Read and update humor mix configurations.',
    mode: 'update',
    tableCandidates: ['humor_mix'],
  },
  {
    slug: 'example-captions',
    title: 'Example Captions',
    description: 'Create, read, update, and delete example caption rows.',
    mode: 'crud',
    tableCandidates: ['example_captions'],
  },
  {
    slug: 'terms',
    title: 'Terms',
    description: 'Create, read, update, and delete terms.',
    mode: 'crud',
    tableCandidates: ['terms'],
  },
  {
    slug: 'captions',
    title: 'Captions',
    description: 'Read caption rows used in the main app.',
    mode: 'read',
    tableCandidates: ['captions'],
  },
  {
    slug: 'caption-requests',
    title: 'Caption Requests',
    description: 'Read inbound caption generation requests.',
    mode: 'read',
    tableCandidates: ['caption_requests'],
  },
  {
    slug: 'caption-examples',
    title: 'Caption Examples',
    description: 'Create, read, update, and delete caption example rows.',
    mode: 'crud',
    tableCandidates: ['caption_examples'],
  },
  {
    slug: 'llm-models',
    title: 'LLM Models',
    description: 'Create, read, update, and delete model registry rows.',
    mode: 'crud',
    tableCandidates: ['llm_models'],
  },
  {
    slug: 'llm-providers',
    title: 'LLM Providers',
    description: 'Create, read, update, and delete provider rows.',
    mode: 'crud',
    tableCandidates: ['llm_providers'],
  },
  {
    slug: 'llm-prompt-chains',
    title: 'LLM Prompt Chains',
    description: 'Read prompt chain definitions.',
    mode: 'read',
    tableCandidates: ['llm_prompt_chains'],
  },
  {
    slug: 'llm-responses',
    title: 'LLM Responses',
    description: 'Read generated model responses and metadata.',
    mode: 'read',
    tableCandidates: ['llm_model_responses', 'llm_responses'],
  },
  {
    slug: 'allowed-signup-domains',
    title: 'Allowed Signup Domains',
    description: 'Create, read, update, and delete allowed domains.',
    mode: 'crud',
    tableCandidates: ['allowed_signup_domains'],
  },
  {
    slug: 'whitelisted-emails',
    title: 'Whitelisted Email Addresses',
    description: 'Create, read, update, and delete whitelisted emails.',
    mode: 'crud',
    tableCandidates: ['whitelisted_email_addresses', 'whitelisted_emails'],
  },
]

export function getResourceBySlug(slug: string) {
  return ADMIN_RESOURCES.find((resource) => resource.slug === slug)
}
