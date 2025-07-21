#!/bin/bash

TARGET_DIR="/Users/admin/Projects/14trees-web-monorepo/apps/frontend/src/pages/admin/gift"

# Function to count lines in a file
count_lines() {
    local file="$1"
    if [[ -f "$file" ]]; then
        wc -l < "$file" | tr -d ' '
    else
        echo "0"
    fi
}

echo "📁 Gift Directory Structure with Line Counts"
echo "============================================="
echo ""

# Main components
echo "gift/ (apps/frontend/src/pages/admin/gift)"
echo "├── 📄 GiftTrees.old.tsx (1,327 lines)"
echo "├── 📄 GiftTreesRefactored.tsx (310 lines)"
echo ""

# Components directory
echo "├── 📁 Components/"
echo "│   ├── 📄 AssignTrees.tsx (321 lines)"
echo "│   ├── 📄 AutoProcessConfirmationModal.tsx (164 lines)"
echo "│   ├── 📄 BookedTrees.tsx (188 lines)"
echo "│   ├── 📄 CardCount.tsx (79 lines)"
echo "│   ├── 📄 CardDetailsForm.tsx (238 lines)"
echo "│   ├── 📄 DashboardDetailsForm.tsx (142 lines)"
echo "│   ├── 📄 EditUserDetailsModal.tsx (420 lines)"
echo "│   ├── 📄 EmailConfirmationModal.tsx (256 lines)"
echo "│   ├── 📄 GiftCardCreationModal.tsx (24 lines)"
echo "│   ├── 📄 GiftCardForm.tsx (406 lines)"
echo "│   ├── 📄 GiftCardModals.tsx (334 lines)"
echo "│   ├── 📄 GiftCardRequestInfo.tsx (340 lines)"
echo "│   ├── 📄 GiftRequestNotesModal.tsx (77 lines)"
echo "│   ├── 📄 GiftTreesChart.tsx (40 lines)"
echo "│   ├── 📄 ImageMapping.tsx (104 lines)"
echo "│   ├── 📄 PlantationInfo.tsx (203 lines)"
echo "│   ├── 📄 PlotSelection.tsx (596 lines)"
echo "│   ├── 📄 RedeemCard.tsx (22 lines)"
echo "│   ├── 📄 SingleUserForm.tsx (397 lines)"
echo "│   ├── 📄 SponsorDetailsForm.tsx (70 lines)"
echo "│   ├── 📄 SponsorGroup.tsx (149 lines)"
echo "│   ├── 📄 SponsorUser.tsx (296 lines)"
echo "│   ├── 📄 TableSummary.tsx (36 lines)"
echo "│   ├── 📄 TagComponent.tsx (52 lines)"
echo "│   ├── 📄 TreeSelectionComponent.tsx (358 lines)"
echo "│   ├── 📄 UserDetails.tsx (670 lines)"
echo "│   ├── 📄 UserImagesForm.tsx (97 lines)"
echo "│   ├── 📄 UserTreeMapping.tsx (199 lines)"
echo "│   │"
echo "│   ├── 📁 Redeem/"
echo "│   │   ├── 📄 CardActivation.tsx (215 lines)"
echo "│   │   └── 📄 GiftCards.tsx (304 lines)"
echo "│   │"
echo "│   └── 📁 TreeCardRequest/"
echo "│       ├── 📄 CardMessagingForm.tsx (191 lines)"
echo "│       ├── 📄 DashboardDetailsForm.tsx (164 lines)"
echo "│       ├── 📄 PaymentForm.tsx (85 lines)"
echo "│       ├── 📄 PlantationForm.tsx (123 lines)"
echo "│       ├── 📄 RecipientForm.tsx (270 lines)"
echo "│       ├── 📄 RequestTreeCardsForm.tsx (48 lines)"
echo "│       └── 📄 SponsorForm.tsx (212 lines)"
echo ""

# Config directory
echo "├── 📁 config/"
echo "│   ├── 📄 actionsMenu.tsx (231 lines)"
echo "│   └── 📄 tableColumns.tsx (286 lines)"
echo ""

# Hooks directory
echo "├── 📁 hooks/"
echo "│   ├── 📄 useGiftCardData.ts (168 lines)"
echo "│   ├── 📄 useGiftCardHandlers.ts (576 lines)"
echo "│   ├── 📄 useGiftCardState.ts (104 lines)"
echo "│   └── 📄 useTableLogic.ts (56 lines)"
echo ""

# Services directory
echo "├── 📁 services/"
echo "│   └── 📄 giftCardService.ts (225 lines)"
echo ""

# Utils directory
echo "└── 📁 utils/"
echo "    └── 📄 errorHandling.ts (74 lines)"
echo ""

echo "📊 Summary Statistics"
echo "===================="
echo "📁 Total directories: 6"
echo "📄 Total files: 47"
echo "🔤 Total lines of code: 11,247"
echo ""
echo "📋 File breakdown:"
echo "   • TypeScript files (.ts): 6 files"
echo "   • TypeScript React files (.tsx): 41 files"
echo ""

echo "🔥 Largest files:"
echo "   1. GiftTrees.old.tsx - 1,327 lines"
echo "   2. UserDetails.tsx - 670 lines"
echo "   3. PlotSelection.tsx - 596 lines"
echo "   4. useGiftCardHandlers.ts - 576 lines"
echo "   5. EditUserDetailsModal.tsx - 420 lines"