import React, { useEffect, useRef, useState } from 'react';
import {
  AudioLines,
  Check,
  ChevronDown,
  CloudUpload,
  ImagePlus,
  Layers3,
  ShieldCheck,
  Sparkles,
  Waves,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import UserQuickActions from '../components/layout/UserQuickActions';
import { getAuthSession, hydrateAuthSession } from '../utils/auth';
import { authFetch } from '../utils/authFetch';

type UploadAssetKey = 'previewMp3' | 'coverArt' | 'wavFile' | 'stemsZip';
type UploadSectionKey = 'metadata' | 'media' | 'license';
type SampleDetail = {
  id: number;
  isRoyaltyFree: boolean;
  ownerName: string;
  sourceLink: string;
};
type MetadataForm = {
  title: string;
  beatType: string;
  genre: string;
  instruments: string[];
  tempo: string;
  musicalKey: string;
};
type SellerUploadDraft = {
  activeSection: UploadSectionKey;
  metadataForm: MetadataForm;
  selectedMoods: string[];
  selectedTags: string[];
  tagInput: string;
  sampleUsed: boolean;
  sampleDetails: SampleDetail[];
  uploadedFiles: Record<UploadAssetKey, string>;
  licensePricing: Record<string, string>;
  licenseForm: LicenseForm;
};
type UploadNotice = {
  tone: 'success' | 'error';
  message: string;
};
type LicenseForm = {
  mode: 'manual' | 'presets';
  freeMp3Enabled: boolean;
  wavEnabled: boolean;
  wavStemsEnabled: boolean;
  exclusiveEnabled: boolean;
  publishingRights: string;
  masterRecordings: string;
  licensePeriod: string;
  exclusivePublishingRights: string;
  exclusiveNegotiable: boolean;
  agreementAccepted: boolean;
};

const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'] as const;
const beatOptions = ['My Beats', 'Draft Uploads'] as const;
const dashboardRoutes: Record<(typeof dashboardOptions)[number], string> = {
  'Seller Dashboard': '/dashboard/seller',
  'Buyer Dashboard': '/dashboard/buyer',
};

const browseSections = [
  { title: 'Sales', items: ['Orders Received', 'Payouts', 'Customers'] },
  { title: 'Workspace', items: ['Analytics', 'Licenses', 'Upload Queue'] },
];
const beatOptionRoutes: Record<string, string> = {
  'My Beats': '/studio',
  'Draft Uploads': '/dashboard/seller/upload',
};
const browseItemRoutes: Record<string, string> = {
  'Orders Received': '/dashboard/seller',
  Payouts: '/dashboard/seller',
  Customers: '/dashboard/seller',
  Analytics: '/dashboard/seller',
  Licenses: '/dashboard/seller',
  'Upload Queue': '/dashboard/seller/upload',
};

const typeOptions = ['Trap', 'Drill', 'R&B', 'Afrobeat', 'Lo-fi', 'Cinematic'];
const genreOptions = ['Hip Hop', 'Pop', 'Soul', 'Dancehall', 'House', 'Alternative'];
const instrumentOptions = ['808', 'Piano', 'Guitar', 'Synth', 'Strings', 'Flute'];
const moodOptions = ['Dark', 'Energetic', 'Melodic', 'Dreamy', 'Aggressive', 'Ambient'];
const keyOptions = ['C Minor', 'D Minor', 'E Minor', 'F Minor', 'G Minor', 'A Minor'];
const SELLER_UPLOAD_DRAFT_STORAGE_PREFIX = 'beathaven_seller_upload_draft';
const getSellerUploadDraftStorageKey = (userId?: string | null): string =>
  `${SELLER_UPLOAD_DRAFT_STORAGE_PREFIX}:${userId || 'guest'}`;
const createDefaultMetadataForm = (): MetadataForm => ({
  title: '',
  beatType: '',
  genre: '',
  instruments: [],
  tempo: '',
  musicalKey: '',
});
const createDefaultSampleDetails = (): SampleDetail[] => [
  {
    id: 1,
    isRoyaltyFree: false,
    ownerName: '',
    sourceLink: '',
  },
];
const createEmptyUploadedFiles = (): Record<UploadAssetKey, string> => ({
  previewMp3: '',
  coverArt: '',
  wavFile: '',
  stemsZip: '',
});
const createDefaultLicensePricing = (): Record<string, string> => ({
  basic: '',
  premium: '',
  exclusive: '',
});
const createDefaultLicenseForm = (): LicenseForm => ({
  mode: 'manual',
  freeMp3Enabled: false,
  wavEnabled: true,
  wavStemsEnabled: true,
  exclusiveEnabled: true,
  publishingRights: '',
  masterRecordings: '',
  licensePeriod: '',
  exclusivePublishingRights: '',
  exclusiveNegotiable: false,
  agreementAccepted: false,
});

const uploadFields = [
  {
    key: 'previewMp3' as UploadAssetKey,
    title: 'Upload tagged MP3 file',
    format: '(.mp3 format)',
    instruction: 'Upload a tagged MP3 file. Size should be between 2MB and 10MB.',
    accept: '.mp3,audio/mpeg',
    icon: AudioLines,
  },
  {
    key: 'coverArt' as UploadAssetKey,
    title: 'Upload Cover Art file',
    format: '(.png, .jpg, .jpeg format)',
    instruction: 'Upload a clean square cover image with dimensions of 220x220 and should not exceed 2MB.',
    accept: 'image/*',
    icon: ImagePlus,
  },
  {
    key: 'wavFile' as UploadAssetKey,
    title: 'Upload untagged WAV file',
    format: '(.wav format)',
    instruction: 'Upload the untagged stereo 144kHz WAV file. Size should be between 10MB and 30MB.',
    accept: '.wav,audio/wav',
    icon: Waves,
  },
  {
    key: 'stemsZip' as UploadAssetKey,
    title: 'Upload STEM files',
    format: '(.zip, .rar format)',
    instruction: 'Upload a single zip containing all clearly named stem files.',
    accept: '.zip,.rar,.7z',
    icon: Layers3,
  },
];

const uploadSections = [
  {
    key: 'metadata' as UploadSectionKey,
    label: 'Meta Data',
    icon: Sparkles,
    title: 'Meta data',
  },
  {
    key: 'media' as UploadSectionKey,
    label: 'Media Upload',
    icon: CloudUpload,
    title: 'Media upload',
  },
  {
    key: 'license' as UploadSectionKey,
    label: 'License',
    icon: ShieldCheck,
    title: 'License pricing',
  },
];

const SellerUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const draftStorageKey = getSellerUploadDraftStorageKey(getAuthSession()?.user?.id);
  const [isMoodDropdownOpen, setIsMoodDropdownOpen] = useState(false);
  const [isInstrumentDropdownOpen, setIsInstrumentDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<UploadSectionKey>('metadata');
  const [metadataForm, setMetadataForm] = useState<MetadataForm>(createDefaultMetadataForm);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [sampleUsed, setSampleUsed] = useState(false);
  const [sampleDetails, setSampleDetails] = useState<SampleDetail[]>(createDefaultSampleDetails);
  const [uploadedFiles, setUploadedFiles] = useState<Record<UploadAssetKey, string>>(createEmptyUploadedFiles);
  const [actualFiles, setActualFiles] = useState<Record<UploadAssetKey, File | null>>({ previewMp3: null, coverArt: null, wavFile: null, stemsZip: null });
  const [mediaInputResetKey, setMediaInputResetKey] = useState(0);
  const [licensePricing, setLicensePricing] = useState<Record<string, string>>(createDefaultLicensePricing);
  const [licenseForm, setLicenseForm] = useState<LicenseForm>(createDefaultLicenseForm);
  const [draftStatus, setDraftStatus] = useState('');
  const [isDraftStatusVisible, setIsDraftStatusVisible] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<UploadNotice | null>(null);
  const [isUploadNoticeVisible, setIsUploadNoticeVisible] = useState(false);
  const moodDropdownRef = useRef<HTMLDivElement | null>(null);
  const instrumentDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (moodDropdownRef.current && !moodDropdownRef.current.contains(target)) {
        setIsMoodDropdownOpen(false);
      }

      if (instrumentDropdownRef.current && !instrumentDropdownRef.current.contains(target)) {
        setIsInstrumentDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!draftStatus) {
      return;
    }

    setIsDraftStatusVisible(true);

    const fadeTimeoutId = window.setTimeout(() => {
      setIsDraftStatusVisible(false);
    }, 2400);

    const timeoutId = window.setTimeout(() => {
      setDraftStatus('');
    }, 3000);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [draftStatus]);

  useEffect(() => {
    if (!uploadNotice) {
      return;
    }

    setIsUploadNoticeVisible(true);

    const fadeTimeoutId = window.setTimeout(() => {
      setIsUploadNoticeVisible(false);
    }, 2600);

    const timeoutId = window.setTimeout(() => {
      setUploadNotice(null);
    }, 3200);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [uploadNotice]);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftStorageKey);

    if (!savedDraft) {
      return;
    }

    try {
      const parsedDraft = JSON.parse(savedDraft) as SellerUploadDraft;
      const restoredSection = parsedDraft.activeSection;
      const isValidSection =
        restoredSection === 'metadata' || restoredSection === 'media' || restoredSection === 'license';

      setActiveSection(isValidSection ? restoredSection : 'metadata');
      const restoredMetadataForm = parsedDraft.metadataForm ?? createDefaultMetadataForm();
      setMetadataForm({
        ...createDefaultMetadataForm(),
        ...restoredMetadataForm,
        instruments: Array.isArray(restoredMetadataForm.instruments)
          ? restoredMetadataForm.instruments
          : [],
      });
      setSelectedMoods(Array.isArray(parsedDraft.selectedMoods) ? parsedDraft.selectedMoods : []);
      setSelectedTags(Array.isArray(parsedDraft.selectedTags) ? parsedDraft.selectedTags : []);
      setTagInput(parsedDraft.tagInput ?? '');
      setSampleUsed(parsedDraft.sampleUsed ?? false);
      setSampleDetails(
        parsedDraft.sampleDetails?.length
          ? parsedDraft.sampleDetails
          : createDefaultSampleDetails(),
      );
      setUploadedFiles(parsedDraft.uploadedFiles ?? createEmptyUploadedFiles());
      setLicensePricing(parsedDraft.licensePricing ?? createDefaultLicensePricing());
      setLicenseForm({
        ...createDefaultLicenseForm(),
        ...parsedDraft.licenseForm,
      });
      setDraftStatus('Draft restored');
    } catch {
      setDraftStatus('Could not restore draft');
      window.localStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey]);

  const toggleMood = (mood: string) => {
    setSelectedMoods((current) =>
      current.includes(mood) ? current.filter((item) => item !== mood) : [...current, mood],
    );
  };

  const toggleInstrument = (instrument: string) => {
    setMetadataForm((current) => ({
      ...current,
      instruments: current.instruments.includes(instrument)
        ? current.instruments.filter((item) => item !== instrument)
        : [...current.instruments, instrument],
    }));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag || selectedTags.includes(trimmedTag)) return;
    setSelectedTags((current) => [...current, trimmedTag]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setSelectedTags((current) => current.filter((item) => item !== tag));
  };

  const handleFileChange = (key: UploadAssetKey, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploadedFiles((current) => ({ ...current, [key]: file.name }));
    setActualFiles((current) => ({ ...current, [key]: file }));
  };

  const updateMetadataField = <K extends keyof MetadataForm>(field: K, value: MetadataForm[K]) => {
    setMetadataForm((current) => ({ ...current, [field]: value }));
  };

  const updateSampleDetail = <K extends keyof SampleDetail>(
    id: number,
    field: K,
    value: SampleDetail[K],
  ) => {
    setSampleDetails((current) =>
      current.map((sample) => (sample.id === id ? { ...sample, [field]: value } : sample)),
    );
  };

  const addSampleDetail = () => {
    setSampleDetails((current) => [
      ...current,
      {
        id: Date.now(),
        isRoyaltyFree: false,
        ownerName: '',
        sourceLink: '',
      },
    ]);
  };

  const removeSampleDetail = (id: number) => {
    setSampleDetails((current) =>
      current.length > 1 ? current.filter((sample) => sample.id !== id) : current,
    );
  };

  const activeSectionConfig = uploadSections.find((section) => section.key === activeSection)!;
  const ActiveBadgeIcon = activeSectionConfig.icon;
  const activeSectionIndex = uploadSections.findIndex((section) => section.key === activeSection);
  const isLastSection = activeSectionIndex === uploadSections.length - 1;

  const handleNextSection = () => {
    if (isLastSection) {
      return;
    }

    const nextSection = uploadSections[activeSectionIndex + 1];

    if (nextSection) {
      setActiveSection(nextSection.key);
    }
  };

  const handleSaveDraft = () => {
    const draftPayload: SellerUploadDraft = {
      activeSection,
      metadataForm,
      selectedMoods,
      selectedTags,
      tagInput,
      sampleUsed,
      sampleDetails,
      uploadedFiles,
      licensePricing,
      licenseForm,
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
    setDraftStatus('Draft saved');
  };

  const handleClearAll = () => {
    const existingDraft = window.localStorage.getItem(draftStorageKey);
    let parsedDraft: SellerUploadDraft | null = null;

    if (existingDraft) {
      try {
        parsedDraft = JSON.parse(existingDraft) as SellerUploadDraft;
      } catch {
        window.localStorage.removeItem(draftStorageKey);
      }
    }

    if (activeSection === 'metadata') {
      const clearedMetadataForm = createDefaultMetadataForm();
      const clearedMoods: string[] = [];
      const clearedTags: string[] = [];
      const clearedTagInput = '';
      const clearedSampleUsed = false;
      const clearedSampleDetails = createDefaultSampleDetails();

      setMetadataForm(clearedMetadataForm);
      setSelectedMoods(clearedMoods);
      setSelectedTags(clearedTags);
      setTagInput(clearedTagInput);
      setSampleUsed(clearedSampleUsed);
      setSampleDetails(clearedSampleDetails);

      if (parsedDraft) {
        window.localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            ...parsedDraft,
            metadataForm: clearedMetadataForm,
            selectedMoods: clearedMoods,
            selectedTags: clearedTags,
            tagInput: clearedTagInput,
            sampleUsed: clearedSampleUsed,
            sampleDetails: clearedSampleDetails,
          }),
        );
      }
    }

    if (activeSection === 'media') {
      const clearedUploadedFiles = createEmptyUploadedFiles();

      setUploadedFiles(clearedUploadedFiles);
      setMediaInputResetKey((current) => current + 1);

      if (parsedDraft) {
        window.localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            ...parsedDraft,
            uploadedFiles: clearedUploadedFiles,
          }),
        );
      }
    }

    if (activeSection === 'license') {
      const clearedLicensePricing = createDefaultLicensePricing();
      const clearedLicenseForm = createDefaultLicenseForm();

      setLicensePricing(clearedLicensePricing);
      setLicenseForm(clearedLicenseForm);

      if (parsedDraft) {
        window.localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            ...parsedDraft,
            licensePricing: clearedLicensePricing,
            licenseForm: clearedLicenseForm,
          }),
        );
      }
    }

    setDraftStatus('Section cleared');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearEntireUploadForm = () => {
    setActiveSection('metadata');
    setMetadataForm(createDefaultMetadataForm());
    setSelectedMoods([]);
    setSelectedTags([]);
    setTagInput('');
    setSampleUsed(false);
    setSampleDetails(createDefaultSampleDetails());
    setUploadedFiles(createEmptyUploadedFiles());
    setActualFiles({ previewMp3: null, coverArt: null, wavFile: null, stemsZip: null });
    setMediaInputResetKey((current) => current + 1);
    setLicensePricing(createDefaultLicensePricing());
    setLicenseForm(createDefaultLicenseForm());
    window.localStorage.removeItem(draftStorageKey);
  };

  const handleSubmit = async () => {
    if (!actualFiles.coverArt || !actualFiles.previewMp3) {
      setUploadNotice({ tone: 'error', message: 'Please upload Cover Art and MP3 before submitting.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("artwork", actualFiles.coverArt);
      formData.append("untaggedMp3", actualFiles.previewMp3);
      if (actualFiles.wavFile) formData.append("untaggedWav", actualFiles.wavFile);
      if (actualFiles.stemsZip) formData.append("stems", actualFiles.stemsZip);

      formData.append("title", metadataForm.title);
      formData.append("beatType", metadataForm.beatType);
      formData.append("genre", metadataForm.genre);
      formData.append("instruments", JSON.stringify(metadataForm.instruments));
      formData.append("tempo", metadataForm.tempo.toString());
      formData.append("musicalKey", metadataForm.musicalKey);
      formData.append("moods", JSON.stringify(selectedMoods));
      formData.append("tags", JSON.stringify(selectedTags));

      formData.append("isSampleUsed", String(sampleUsed));
      formData.append("sampleDetails", JSON.stringify(sampleDetails));

      formData.append("freeMp3Enabled", String(licenseForm.freeMp3Enabled));
      formData.append("wavEnabled", String(licenseForm.wavEnabled));
      if (licensePricing.basic) formData.append("basicPrice", licensePricing.basic);
      formData.append("wavStemsEnabled", String(licenseForm.wavStemsEnabled));
      if (licensePricing.premium) formData.append("premiumPrice", licensePricing.premium);
      if (licenseForm.publishingRights) formData.append("publishingRights", licenseForm.publishingRights);
      if (licenseForm.masterRecordings) formData.append("masterRecordings", licenseForm.masterRecordings);
      if (licenseForm.licensePeriod) formData.append("licensePeriod", licenseForm.licensePeriod);

      formData.append("exclusiveEnabled", String(licenseForm.exclusiveEnabled));
      if (licensePricing.exclusive) formData.append("exclusivePrice", licensePricing.exclusive);
      formData.append("exclusiveNegotiable", String(licenseForm.exclusiveNegotiable));
      if (licenseForm.exclusivePublishingRights) formData.append("exclusivePublishingRights", licenseForm.exclusivePublishingRights);

      let session = getAuthSession();
      if (!session) {
        session = await hydrateAuthSession();
      }

      if (!session?.accessToken) {
        setUploadNotice({ tone: 'error', message: 'Your session expired. Please sign in again.' });
        return;
      }
      const response = await authFetch(`${import.meta.env.VITE_API_URL}/beats`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        window.dispatchEvent(new Event('beathaven-beat-uploaded'));
        clearEntireUploadForm();
        navigate('/studio');
      } else {
        const message =
          data?.message ||
          data?.error?.details ||
          `Upload failed with status ${response.status}`;
        setUploadNotice({ tone: 'error', message: `Upload failed: ${message}` });
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setUploadNotice({ tone: 'error', message: `Error uploading beat: ${message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMetadataSection = () => (
    <div className="mt-8 space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-3">
          <input type="text" value={metadataForm.title} onChange={(event) => updateMetadataField('title', event.target.value)} placeholder="Title of beat" className="w-full rounded-[1.2rem] border border-[#2A2A2A] bg-[#101010] px-4 py-3.5 text-sm text-white outline-none transition-colors focus:border-[#1ED760]" />
        </label>
        <label className="space-y-3">
          <select value={metadataForm.beatType} onChange={(event) => updateMetadataField('beatType', event.target.value)} className="w-full rounded-[1.2rem] border border-[#2A2A2A] bg-[#101010] px-4 py-3.5 text-sm text-white outline-none transition-colors focus:border-[#1ED760]">
            <option value="">Select beat type</option>
            {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-3">
          <select value={metadataForm.genre} onChange={(event) => updateMetadataField('genre', event.target.value)} className="w-full rounded-[1.2rem] border border-[#2A2A2A] bg-[#101010] px-4 py-3.5 text-sm text-white outline-none transition-colors focus:border-[#1ED760]">
            <option value="">Select genre</option>
            {genreOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <div ref={instrumentDropdownRef} className="relative space-y-3">
          <button
            type="button"
            onClick={() => setIsInstrumentDropdownOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-[1.2rem] border border-[#2A2A2A] bg-[#101010] px-4 py-3.5 text-left text-sm text-white transition-colors focus:outline-none hover:border-[#1ED760]"
          >
            <span className={metadataForm.instruments.length ? 'text-white' : 'text-[#6B7280]'}>
              {metadataForm.instruments.length
                ? metadataForm.instruments.join(', ')
                : 'Select instruments used'}
            </span>
            <ChevronDown
              size={16}
              className={
                isInstrumentDropdownOpen
                  ? 'rotate-180 transition-transform duration-200'
                  : 'transition-transform duration-200'
              }
            />
          </button>

          {isInstrumentDropdownOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <div className="space-y-1">
                {instrumentOptions.map((instrument) => {
                  const isSelected = metadataForm.instruments.includes(instrument);

                  return (
                    <button
                      key={instrument}
                      type="button"
                      onClick={() => toggleInstrument(instrument)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors duration-200 ${isSelected
                        ? 'bg-[#161616] text-white'
                        : 'text-[#B3B3B3] hover:bg-[#161616] hover:text-white'
                        }`}
                    >
                      <span>{instrument}</span>
                      {isSelected ? <Check size={14} className="text-[#1ED760]" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
        <label className="space-y-3">
          <span className="text-sm font-semibold text-white">Tempo</span>
          <div className="relative">
            <input type="number" value={metadataForm.tempo} onChange={(event) => updateMetadataField('tempo', event.target.value)} placeholder="140" className="w-full rounded-[1.2rem] border border-[#2A2A2A] bg-[#101010] px-4 py-3.5 pr-16 text-sm text-white outline-none transition-colors focus:border-[#1ED760]" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">BPM</span>
          </div>
        </label>
        <label className="space-y-3">
          <span className="text-sm font-semibold text-white">Key</span>
          <select value={metadataForm.musicalKey} onChange={(event) => updateMetadataField('musicalKey', event.target.value)} className="w-full rounded-[1.2rem] border border-[#2A2A2A] bg-[#101010] px-4 py-3.5 text-sm text-white outline-none transition-colors focus:border-[#1ED760]">
            <option value="">Select musical key</option>
            {keyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Moods</h3>
          </div>
        </div>
        <div ref={moodDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsMoodDropdownOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-[1.2rem] border border-[#2A2A2A] bg-[#101010] px-4 py-3.5 text-left text-sm text-white transition-colors focus:outline-none hover:border-[#1ED760]"
          >
            <span className={selectedMoods.length ? 'text-white' : 'text-[#6B7280]'}>
              {selectedMoods.length ? selectedMoods.join(', ') : 'Select moods'}
            </span>
            <ChevronDown
              size={16}
              className={isMoodDropdownOpen ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'}
            />
          </button>

          {isMoodDropdownOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <div className="space-y-1">
                {moodOptions.map((mood) => {
                  const isSelected = selectedMoods.includes(mood);

                  return (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => toggleMood(mood)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors duration-200 ${isSelected
                        ? 'bg-[#161616] text-white'
                        : 'text-[#B3B3B3] hover:bg-[#161616] hover:text-white'
                        }`}
                    >
                      <span>{mood}</span>
                      {isSelected ? <Check size={14} className="text-[#1ED760]" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Tags</h3>
            <p className="mt-1 text-sm text-[#9CA3AF]">Add marketplace keywords like artist references, use cases, or sonic descriptors.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input type="text" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} placeholder="Add a tag and press enter" className="w-full rounded-[1.2rem] border border-[#2A2A2A] bg-[#101010] px-4 py-3.5 text-sm text-white outline-none transition-colors focus:border-[#1ED760]" />
            <Button type="button" variant="secondary" onClick={addTag} className="sm:min-w-[120px]">Add Tag</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {selectedTags.map((tag) => (
              <button key={tag} type="button" onClick={() => removeTag(tag)} className="rounded-full border border-[#2A2A2A] bg-[#111111] px-4 py-2 text-sm text-[#D1D5DB] transition-colors duration-200 hover:border-[#FF4D6D] hover:text-white">{tag} x</button>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-[1.6rem] border border-[#262626] bg-gradient-to-br from-[#151515] to-[#101010] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white">Is sample used?</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#9CA3AF]">
              If enabled, add one entry for each sample used in this beat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSampleUsed((current) => !current)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${sampleUsed ? 'bg-[#1ED760]' : 'bg-[#2A2A2A]'
              }`}
            aria-pressed={sampleUsed}
            aria-label="Toggle sample used"
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${sampleUsed ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>

        {sampleUsed ? (
          <div className="mt-5 space-y-4">
            {sampleDetails.map((sample, index) => (
              <div key={sample.id} className="rounded-[1.4rem] border border-[#2A2A2A] bg-[#101010] p-4">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-sm font-semibold text-white">Sample {index + 1}</h4>
                  {sampleDetails.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeSampleDetail(sample.id)}
                      className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF6B6B] transition-colors hover:text-white"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <label className="mt-4 flex items-center gap-3 px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={sample.isRoyaltyFree}
                    onChange={(event) =>
                      updateSampleDetail(sample.id, 'isRoyaltyFree', event.target.checked)
                    }
                    className="h-4 w-4 rounded border-[#3A3A3A] bg-[#0B0B0B] text-[#1ED760] focus:ring-[#1ED760]"
                  />
                  This sample is royalty free
                </label>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <input
                      type="text"
                      value={sample.ownerName}
                      onChange={(event) =>
                        updateSampleDetail(sample.id, 'ownerName', event.target.value)
                      }
                      placeholder="Sample owner name"
                      className="w-full rounded-[1.1rem] border border-[#2A2A2A] bg-[#0D0D0D] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1ED760]"
                    />
                  </label>

                  <label className="space-y-2">
                    <input
                      type="url"
                      value={sample.sourceLink}
                      onChange={(event) =>
                        updateSampleDetail(sample.id, 'sourceLink', event.target.value)
                      }
                      placeholder="Sample/Owner link"
                      className="w-full rounded-[1.1rem] border border-[#2A2A2A] bg-[#0D0D0D] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1ED760]"
                    />
                  </label>
                </div>
              </div>
            ))}

            <Button type="button" variant="secondary" onClick={addSampleDetail}>
              Add+
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderMediaSection = () => (
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      {uploadFields.map(({ key, title, format, instruction, accept, icon: Icon }) => (
        <label
          key={`${mediaInputResetKey}-${key}`}
          className="group flex h-[160px] cursor-pointer flex-col items-center justify-center rounded-[1.45rem] border border-dashed border-[#676767] bg-[#232323] px-6 py-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[#B8B8B8] hover:bg-[#272727]"
        >
          <input type="file" accept={accept} className="hidden" onChange={(event) => handleFileChange(key, event.target.files)} />
          <div className="flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center text-[#8C8C8C] transition-colors duration-200 group-hover:text-[#D4D4D4]">
              <Icon size={36} strokeWidth={1.6} />
            </div>
            {uploadedFiles[key] ? (
              <div className="mt-4 max-w-full truncate rounded-full border border-[#3A3A3A] bg-[#1A1A1A] px-4 py-2 text-sm text-[#D1D5DB]">
                {uploadedFiles[key]}
              </div>
            ) : (
              <div className="mt-4 flex items-start justify-center gap-3">
                <div>
                  <p className="text-[1.02rem] font-medium leading-snug text-white">{title}</p>
                  <p className="mt-1 text-sm leading-snug text-[#D5D5D5]">{format}</p>
                </div>
                <div className="group/info relative mt-0.5 shrink-0">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E5E7EB] text-[11px] font-bold text-[#111111]">
                    i
                  </span>
                  <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-20 w-56 -translate-x-1/2 rounded-xl border border-[#3A3A3A] bg-[#111111] px-3 py-2 text-left text-xs leading-relaxed text-[#D4D4D4] opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-200 group-hover/info:opacity-100">
                    {instruction}
                  </div>
                </div>
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );

  const renderLicenseSection = () => (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-4 rounded-[0.8rem] bg-[#1E1E1E] px-6 py-5">
        <span className="text-sm font-medium text-white">Enable Free MP3 Download?</span>
        <button
          type="button"
          onClick={() =>
            setLicenseForm((current) => ({
              ...current,
              freeMp3Enabled: !current.freeMp3Enabled,
            }))
          }
          className={`relative h-[1.125rem] w-8 shrink-0 rounded-full transition-colors duration-200 ${licenseForm.freeMp3Enabled ? 'bg-[#5B10FF]' : 'bg-[#333333]'
            }`}
          aria-label="Toggle free mp3 download"
          aria-pressed={licenseForm.freeMp3Enabled}
        >
          <span
            className={`absolute left-[0.125rem] top-[0.125rem] h-[0.875rem] w-[0.875rem] rounded-full bg-[#1A1A1A] transition-transform duration-200 ${licenseForm.freeMp3Enabled ? 'translate-x-[0.875rem]' : 'translate-x-0'
              }`}
          />
        </button>
      </div>

      <div className="rounded-[0.8rem] bg-[#1E1E1E] p-6 lg:p-8">
        <h3 className="text-xl font-medium text-white mb-6">Non Exclusive License</h3>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-2">
          {/* Left Column: License Fee */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-medium text-white mb-1">License Fee</h4>

            {/* WAV Block */}
            <div className="rounded-[0.6rem] bg-[#292929] overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-sm font-medium text-white">WAV</span>
                <button
                  type="button"
                  onClick={() => setLicenseForm(c => ({ ...c, wavEnabled: !c.wavEnabled }))}
                  className={`relative h-[1.125rem] w-8 rounded-full transition-colors duration-200 ${licenseForm.wavEnabled ? 'bg-[#5B10FF]' : 'bg-[#4A4A4A]'
                    }`}
                >
                  <span
                    className={`absolute left-[0.125rem] top-[0.125rem] h-[0.875rem] w-[0.875rem] rounded-full bg-[#1A1A1A] transition-transform duration-200 ${licenseForm.wavEnabled ? 'translate-x-[0.875rem]' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center rounded-lg bg-[#141414] px-3 py-2.5">
                  <span className="text-sm font-medium text-[#7B7B7B]">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={licensePricing.basic}
                    onChange={(event) =>
                      setLicensePricing((current) => ({ ...current, basic: event.target.value }))
                    }
                    placeholder="0"
                    disabled={!licenseForm.wavEnabled}
                    className="ml-1 w-full bg-transparent text-sm font-medium text-white outline-none disabled:text-[#666666]"
                  />
                </div>
              </div>
            </div>

            {/* WAV + STEMS Block */}
            <div className="rounded-[0.6rem] bg-[#292929] overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-sm font-medium text-white">WAV + STEMS</span>
                <button
                  type="button"
                  onClick={() => setLicenseForm(c => ({ ...c, wavStemsEnabled: !c.wavStemsEnabled }))}
                  className={`relative h-[1.125rem] w-8 rounded-full transition-colors duration-200 ${licenseForm.wavStemsEnabled ? 'bg-[#5B10FF]' : 'bg-[#4A4A4A]'
                    }`}
                >
                  <span
                    className={`absolute left-[0.125rem] top-[0.125rem] h-[0.875rem] w-[0.875rem] rounded-full bg-[#1A1A1A] transition-transform duration-200 ${licenseForm.wavStemsEnabled ? 'translate-x-[0.875rem]' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center rounded-lg bg-[#141414] px-3 py-2.5">
                  <span className="text-sm font-medium text-[#7B7B7B]">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={licensePricing.premium}
                    onChange={(event) =>
                      setLicensePricing((current) => ({ ...current, premium: event.target.value }))
                    }
                    placeholder="0"
                    disabled={!licenseForm.wavStemsEnabled}
                    className="ml-1 w-full bg-transparent text-sm font-medium text-white outline-none disabled:text-[#666666]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5 mt-1">
            <label className="block space-y-2">
              <span className="text-[13px] font-medium text-white">Publishing Rights (%)</span>
              <div className="relative">
                <select
                  value={licenseForm.publishingRights}
                  onChange={(event) =>
                    setLicenseForm((current) => ({
                      ...current,
                      publishingRights: event.target.value,
                    }))
                  }
                  className="w-full appearance-none rounded-[0.5rem] bg-[#292929] px-4 py-3 text-sm text-[#9CA3AF] outline-none"
                >
                  <option value="" disabled hidden>Select Publishing Rights</option>
                  <option value="0">0%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white">
                  <ChevronDown size={16} />
                </div>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-[13px] font-medium text-white">No. of master recordings</span>
              <div className="relative">
                <select
                  value={licenseForm.masterRecordings}
                  onChange={(event) =>
                    setLicenseForm((current) => ({
                      ...current,
                      masterRecordings: event.target.value,
                    }))
                  }
                  className="w-full appearance-none rounded-[0.5rem] bg-[#292929] px-4 py-3 text-sm text-[#9CA3AF] outline-none"
                >
                  <option value="" disabled hidden>Select Master Recording</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white">
                  <ChevronDown size={16} />
                </div>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-[13px] font-medium text-white">License Period</span>
              <div className="relative">
                <select
                  value={licenseForm.licensePeriod}
                  onChange={(event) =>
                    setLicenseForm((current) => ({
                      ...current,
                      licensePeriod: event.target.value,
                    }))
                  }
                  className="w-full appearance-none rounded-[0.5rem] bg-[#292929] px-4 py-3 text-sm text-[#9CA3AF] outline-none"
                >
                  <option value="" disabled hidden>Select License Period</option>
                  <option value="5 Years">5 Years</option>
                  <option value="6 Years">6 Years</option>
                  <option value="7 Years">7 Years</option>
                  <option value="8 Years">8 Years</option>
                  <option value="9 Years">9 Years</option>
                  <option value="10 Years">10 Years</option>
                  <option value="15 Years">15 Years</option>
                  <option value="20 Years">20 Years</option>
                  <option value="25 Years">25 Years</option>
                  <option value="30 Years">30 Years</option>
                  <option value="99 Years">99 Years</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white">
                  <ChevronDown size={16} />
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-[0.8rem] bg-[#1E1E1E] p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-medium text-white">Exclusive License</h3>
          <button
            type="button"
            onClick={() => setLicenseForm(c => ({ ...c, exclusiveEnabled: !c.exclusiveEnabled }))}
            className={`relative h-[1.125rem] w-10 rounded-full transition-colors duration-200 ${licenseForm.exclusiveEnabled ? 'bg-[#5B10FF]' : 'bg-[#4A4A4A]'
              }`}
          >
            <span
              className={`absolute left-[0.125rem] top-[0.125rem] h-[0.875rem] w-[0.875rem] rounded-full bg-[#1A1A1A] transition-transform duration-200 ${licenseForm.exclusiveEnabled ? 'translate-x-[1.375rem]' : 'translate-x-0'
                }`}
            />
          </button>
        </div>

        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-2">
          {/* Left Column: License Fee */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-medium text-white mb-2">License Fee</h4>
            <div className="flex items-center rounded-lg bg-[#292929] px-3 py-3">
              <span className="text-sm font-medium text-[#7B7B7B]">₹</span>
              <input
                type="number"
                min="0"
                value={licensePricing.exclusive}
                onChange={(event) =>
                  setLicensePricing((current) => ({ ...current, exclusive: event.target.value }))
                }
                placeholder="0"
                disabled={!licenseForm.exclusiveEnabled}
                className="ml-1 w-full bg-transparent text-sm font-medium text-white outline-none disabled:text-[#666666]"
              />
            </div>

            <div className={`pt-4 mt-2 flex items-center gap-3 ${!licenseForm.exclusiveEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-[13px] font-medium text-white">Is it negotiable?</span>
              <button
                type="button"
                disabled={!licenseForm.exclusiveEnabled}
                onClick={() => setLicenseForm(c => ({ ...c, exclusiveNegotiable: !c.exclusiveNegotiable }))}
                className={`relative h-[1.125rem] w-8 rounded-full transition-colors duration-200 ${licenseForm.exclusiveNegotiable ? 'bg-[#D1D5DB]' : 'bg-[#292929] border border-[#A1A1AA]'
                  }`}
              >
                <span
                  className={`absolute left-[0.125rem] top-[0.125rem] h-[0.875rem] w-[0.875rem] rounded-full bg-[#1E1E1E] transition-transform duration-200 ${licenseForm.exclusiveNegotiable ? 'translate-x-[0.875rem]' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Publishing Rights */}
          <div className="space-y-2 mt-1">
            <label className={`block space-y-2 ${!licenseForm.exclusiveEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-[13px] font-medium text-white">Publishing Rights (%)</span>
              <div className="relative">
                <select
                  disabled={!licenseForm.exclusiveEnabled}
                  value={licenseForm.exclusivePublishingRights}
                  onChange={(event) =>
                    setLicenseForm((current) => ({
                      ...current,
                      exclusivePublishingRights: event.target.value,
                    }))
                  }
                  className="w-full appearance-none rounded-[0.5rem] bg-[#292929] px-4 py-3 text-sm text-[#9CA3AF] outline-none"
                >
                  <option value="" disabled hidden>Select Publishing Rights</option>
                  <option value="0">0%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white">
                  <ChevronDown size={16} />
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 px-1 pt-4 cursor-pointer">
        <div className="pt-0.5">
          <input
            type="checkbox"
            checked={licenseForm.agreementAccepted}
            onChange={(event) =>
              setLicenseForm((current) => ({
                ...current,
                agreementAccepted: event.target.checked,
              }))
            }
            className="h-4 w-4 shrink-0 rounded border-[#5A5A5A] bg-transparent text-[#5B10FF] focus:ring-[#5B10FF] cursor-pointer"
          />
        </div>
        <span className="text-[13px] text-[#A1A1AA] leading-relaxed">
          I hereby state that the Instrumental being uploaded by me on the Beat Store does not contain any pornographic or seditious content in audio/visual manner.
        </span>
      </label>
    </div>
  );

  const renderActiveSection = () => {
    if (activeSection === 'metadata') return renderMetadataSection();
    if (activeSection === 'media') return renderMediaSection();
    return renderLicenseSection();
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-14 left-[-8rem] h-80 w-80 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-9rem] h-80 w-80 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        <div className="fixed inset-x-0 top-0 z-[100] border-b border-[#262626] bg-[#0B0B0B]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="relative z-[120]">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
              <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
                <img
                  src="/beathaven.png"
                  alt="BeatHaven logo"
                  className="h-9 w-9 rounded-xl object-cover shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]"
                />
                <span className="text-xl font-bold text-white tracking-tight">
                  Beat<span className="text-[#1ED760]">Haven</span>
                </span>
              </Link>

              <div className="hidden flex-1 items-center justify-center lg:flex">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                      Dashboard
                      <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      {dashboardOptions.map((option) => (
                        <Link
                          key={option}
                          to={dashboardRoutes[option]}
                          className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors duration-200 ${
                            option === 'Seller Dashboard'
                              ? 'bg-[#161616] text-[#1ED760]'
                              : 'text-[#B3B3B3] hover:bg-[#161616] hover:text-white'
                          }`}
                        >
                          {option}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                      Beats
                      <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <Link to="/dashboard/seller/upload" className="block w-full rounded-xl bg-[#161616] px-4 py-3 text-left text-sm text-[#1ED760]">New Upload</Link>
                      {beatOptions.map((option) => (
                        <Link key={option} to={beatOptionRoutes[option] ?? '/'} className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                          {option}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                      Browse
                      <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-[420px] rounded-[1.4rem] border border-[#262626] bg-[#101010] p-4 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <div className="grid gap-5 sm:grid-cols-2">
                        {browseSections.map((section) => (
                          <div key={section.title}>
                            <div className="space-y-2">
                              {section.items.map((item) => (
                                <Link key={item} to={browseItemRoutes[item] ?? '/'} className="block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white">
                                  {item}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3"><UserQuickActions /></div>
            </div>
          </div>
        </div>

        <section className="relative z-0 mx-auto max-w-7xl px-4 pb-10 pt-[7.5rem] sm:px-5 sm:pb-12 sm:pt-[8.25rem] lg:px-7">
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-4 xl:sticky xl:top-[9.5rem] xl:self-start">
              {uploadSections.map((section) => {
                const Icon = section.icon;
                const isActive = section.key === activeSection;
                return (
                  <button key={section.key} type="button" onClick={() => setActiveSection(section.key)} className={`flex w-full items-center justify-between rounded-[1.5rem] border px-5 py-5 text-left transition-all duration-200 ${isActive ? 'border-[#7C5CFF] bg-gradient-to-r from-[#7C5CFF] to-[#B400FF] text-white shadow-[0_0_30px_rgba(124,92,255,0.35)]' : 'border-[#262626] bg-[#1A1A1A]/95 text-[#D1D5DB] hover:border-[#7C5CFF]/40 hover:bg-[#202020]'}`}>
                    <div className="text-lg font-semibold tracking-tight">{section.label}</div>
                    <Icon size={20} className={isActive ? 'text-white' : 'text-[#A1A1AA]'} />
                  </button>
                );
              })}
            </aside>

            <div className="space-y-6">
              <section className="glass rounded-[2rem] border border-[#262626] p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-[#1ED760]"><ActiveBadgeIcon size={16} className="text-[#1ED760]" /></div>
                    <h2 className="text-3xl font-black tracking-tight text-white">{activeSectionConfig.title}</h2>
                  </div>
                </div>
                {renderActiveSection()}
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="secondary" size="lg" className="justify-center sm:min-w-[180px]" onClick={handleClearAll}>
                    Clear All
                  </Button>
                  <Button variant="accent" size="lg" className="justify-center sm:min-w-[180px]" onClick={handleSaveDraft}>
                    Save Draft
                  </Button>
                </div>
                <Button
                  variant="accent"
                  size="lg"
                  className="justify-center sm:min-w-[180px]"
                  onClick={isLastSection ? handleSubmit : handleNextSection}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : isLastSection ? 'Submit' : 'Next'}
                </Button>
              </div>
              {draftStatus ? (
                <p
                  className={`text-sm text-[#B3B3B3] transition-all duration-500 ${isDraftStatusVisible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
                    }`}
                >
                  {draftStatus}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      {uploadNotice ? (
        <div
          className={`pointer-events-none fixed left-1/2 top-1/2 z-[220] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-5 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-500 ${isUploadNoticeVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${uploadNotice.tone === 'success'
            ? 'border-[#1ED760]/40 bg-[#0f2217] text-[#dbffe9]'
            : 'border-[#ff6b81]/40 bg-[#2a1015] text-[#ffd1d8]'
            }`}
        >
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${uploadNotice.tone === 'success' ? 'bg-[#1ED760]/20 text-[#1ED760]' : 'bg-[#ff6b81]/20 text-[#ff9aac]'
              }`}>
              <Check size={16} />
            </span>
            <p className="text-sm leading-relaxed">{uploadNotice.message}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SellerUploadPage;









