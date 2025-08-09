import React, { useEffect, useRef, useState } from "react";

// AutoComplete Textarea Component
interface AutoCompleteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
  style?: React.CSSProperties;
}

const AutoCompleteTextarea: React.FC<AutoCompleteTextareaProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  rows,
  maxLength,
  style
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (value.length > 10) { // Show suggestions for longer text
      const filtered = suggestions.filter(suggestion => {
        const lowerValue = value.toLowerCase();
        const lowerSuggestion = suggestion.toLowerCase();
        return (
          lowerSuggestion.includes(lowerValue.substring(0, 50)) ||
          lowerValue.includes(lowerSuggestion.substring(0, 50))
        ) && lowerSuggestion !== lowerValue; // Don't show exact matches
      }).slice(0, 3);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [value, suggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setFilteredSuggestions([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize after setting value
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }, 0);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }, 200);
  };

  const handleFocus = () => {
    if (value.length > 10 && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        rows={rows}
        maxLength={maxLength}
        style={style}
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2 text-xs text-gray-600 border-b">Suggested messages:</div>
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="truncate">
                {suggestion.length > 100 ? `${suggestion.substring(0, 100)}...` : suggestion}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const prefix = "Dear {recipient}," + "\n\n"
const secondaryMessage = "\n\n" + 'We invite you to visit 14 Trees and firsthand experience the growth and contribution of your tree towards a greener future.'

const defaultMessages = {
    primary: prefix + 'We are immensely delighted to share that a tree has been planted in your name by {giftedBy} at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, rejuvenating ecosystems, supporting biodiversity, and helping offset the harmful effects of climate change.' + secondaryMessage,
    birthday: prefix + 'We are immensely delighted to share that a tree has been planted in your name on the occasion of your birthday by {giftedBy} at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, helping offset the harmful effects of climate change.' + secondaryMessage,
    memorial: prefix + 'A tree has been planted in the memory of <name here> at the 14 Trees Foundation reforestation site. For many years, this tree will help rejuvenate local ecosystems, support local biodiversity and offset the harmful effects of climate change and global warming.' + secondaryMessage,
    wedding: prefix + 'We are delighted to share that a tree has been planted by {giftedBy} at the 14Trees Foundation, Pune, in your name to celebrate your special union. This tree will be nurtured in your honour, helping offset the harmful effects of climate change.' + secondaryMessage,
    anniversary: prefix + 'We are delighted to share that a tree has been planted in your name to celebrate your Wedding Anniversary by {giftedBy} at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, helping offset the harmful effects of climate change.' + secondaryMessage,
    festival: prefix + 'We are delighted to share that a tree has been planted in your name to celebrate this joyous occasion by {giftedBy} at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, helping offset the harmful effects of climate change.' + secondaryMessage,
    retirement: prefix + 'We are delighted to share that a tree has been planted by {giftedBy} at the 14 Trees Foundation, Pune, in your name to commemorate your retirement. This tree will be nurtured in your honour, helping offset the harmful effects of climate change.' + secondaryMessage,
    logo: 'Gifted by 14 Trees in partnership with'
}

interface GiftCardPreviewProps {
    userName?: string;
    giftedBy?: string;
    primaryMessage: string;
    windowWidth: number;
    setPrimaryMessage: (message: string) => void;
    eventType: string | null;
    previewUrl: string | null;
    setPreviewUrl: (url: string | null) => void;
    presentationId: string | null;
    setPresentationId: (id: string | null) => void;
    slideId: string | null;
    setSlideId: (id: string | null) => void;
    primaryMessageSuggestions?: string[];
    onPrimaryMessageChange?: (message: string) => void;
}

const GiftCardPreview: React.FC<GiftCardPreviewProps> = ({
    userName,
    giftedBy,
    primaryMessage,
    windowWidth,
    setPrimaryMessage,
    eventType,
    previewUrl,
    setPreviewUrl,
    presentationId,
    setPresentationId,
    slideId,
    setSlideId,
    primaryMessageSuggestions = [],
    onPrimaryMessageChange,
}) => {

    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    const dataRef = useRef({
        primaryMessage: "",
        presentationId: null as string | null,
        slideId: null as string | null,
        userName: undefined as string | undefined,
        giftedBy: undefined as string | undefined,
        eventType: null as string | null,
    })

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const eventMessage = eventType === "1" ? defaultMessages.birthday : eventType === "2" ? defaultMessages.memorial : eventType === "4" ? defaultMessages.wedding : eventType === "5" ? defaultMessages.anniversary : eventType === "6" ? defaultMessages.festival : eventType === "7" ? defaultMessages.retirement : defaultMessages.primary;
            const message = primaryMessage === "" || primaryMessage === defaultMessages.primary || primaryMessage === defaultMessages.memorial || primaryMessage === defaultMessages.birthday || primaryMessage === defaultMessages.wedding || primaryMessage === defaultMessages.anniversary || primaryMessage === defaultMessages.festival || primaryMessage === defaultMessages.retirement
                ? eventMessage
                : primaryMessage;

            dataRef.current.primaryMessage = message;
            dataRef.current.eventType = eventType;

            setPrimaryMessage(message);
            if (message != primaryMessage) handleGeneratePreview();

        }, 500);

        return () => clearTimeout(timeoutId);
    }, [eventType, primaryMessage]);

    useEffect(() => {
        dataRef.current.giftedBy = giftedBy;
    }, [giftedBy])

    useEffect(() => {
        dataRef.current.userName = userName;
    }, [userName])
    
    useEffect(() => {
        dataRef.current.primaryMessage = primaryMessage;
    }, [primaryMessage])


    const handleGeneratePreview = async () => {
        setIsGeneratingPreview(true);
        try {
            // Replace {recipient} placeholder with actual name for preview only
            const previewMessage = primaryMessage.replace(
                /\{recipient\}/g,
                userName || "Recipient"
            );

            // Replace {giftedBy} placeholder if it exists
            const finalPreviewMessage = giftedBy
                ? previewMessage.replace(/\{giftedBy\}/g, giftedBy)
                : previewMessage;

            const endpoint = presentationId && slideId
                ? `${process.env.NEXT_PUBLIC_API_URL}/gift-cards/update-template`
                : `${process.env.NEXT_PUBLIC_API_URL}/gift-cards/generate-template`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    presentation_id: dataRef.current.presentationId,
                    slide_id: dataRef.current.slideId,
                    primary_message: dataRef.current.primaryMessage,
                    user_name: dataRef.current.userName,
                    gifted_by: dataRef.current.giftedBy,
                    event_type: dataRef.current.eventType,
                    is_personal: true,
                })
            });

            const data = await response.json();
            if (response.ok) {
                if (data.presentation_id && !dataRef.current.presentationId) {
                    dataRef.current.presentationId = data.presentation_id;
                    dataRef.current.slideId = data.slide_id;
                }

                setPresentationId(data.presentation_id || presentationId);
                setSlideId(data.slide_id || slideId);
                setPreviewUrl(
                    `https://docs.google.com/presentation/d/${data.presentation_id || presentationId}/embed?rm=minimal&slide=id.${data.slide_id || slideId}&timestamp=${Date.now()}`
                );
            }
        } catch (error) {
            console.error("Error generating preview:", error);
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Help us craft a beautiful message for your green tribute!</h3>

            {/* Preview Section */}
            <div className="border min-h-[250px] border-gray-200 rounded-md w-full h-auto flex items-center justify-center">
                {isGeneratingPreview ? (
                    <div className="min-h-[250px] text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Generating your card preview...</p>
                    </div>
                ) : previewUrl ? (
                    <div className="w-full h-full min-h-[250px] aspect-[4/3] sm:aspect-[16/9]">
                        <iframe
                            src={previewUrl}
                            className="w-full h-full border-none rounded-md"
                            title="Gift card preview"
                            style={{ minHeight: "250px", height: "100%", width: "100%", pointerEvents: 'none' }}
                        />
                    </div>
                ) : (
                    <p className="text-gray-500 py-16">Your card preview will appear here</p>
                )}
            </div>

            {/* Note Below Preview */}
            <p className="text-xs text-gray-500 mt-2">
                The illustrations on the final gift card will differ from the template above depending upon the trees planted.
            </p>

            {/* Message Inputs Section */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Your message</label>
                    <AutoCompleteTextarea
                        value={primaryMessage}
                        onChange={(value) => {
                            setPrimaryMessage(value);
                            if (onPrimaryMessageChange) {
                                onPrimaryMessageChange(value);
                            }
                        }}
                        suggestions={primaryMessageSuggestions}
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                        rows={windowWidth > 640 ? 5 : 3}
                        maxLength={430}
                        placeholder="A tree has been planted in your name at our conservation site..."
                        style={{ overflow: "hidden" }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {430 - primaryMessage.length} characters remaining
                    </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleGeneratePreview}
                        disabled={isGeneratingPreview}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingPreview ? "Generating..." : "Generate Preview"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GiftCardPreview;