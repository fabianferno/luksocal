# Luksocal

**LuksoCAL** is a mini dApp designed specifically for the LUKSO Universal Profile Grid to let users book calls with a profile by paying a fee set by the profile owner to meet with them. It empowers creators, consultants, and professionals to seamlessly offer paid or free meetings directly from their Universal Profile without the need for external apps or manual wallet connections. 

Built to integrate natively inside the Universal Profile ecosystem, LuksoCAL leverages the **Grid’s iframe-based UI** and the **UP Provider** to deliver a frictionless experience for both the profile owner and the viewer - powered by the cal.com APIs to provide seamless flows with existing calendars.

### **Key Features**

- **Seamless Booking**: Viewers can book calendar slots directly from a user’s Universal Profile without needing additional wallet popups or connection steps.
    
- **One-Click Payment Flow**: Embedded payment interface using LUKSO-native smart contracts for streamlined transactions.
    
- **Cal.com Integration**: Leverages cal.com APIs to fetch availability, create events, and manage booking notifications.
    
- **Universal Profile Awareness**: Automatically understands whose profile it's embedded in, enabling contextual interaction and data fetches via the UP Provider.
    

---

## **Problem It Solves**

Web3 creators and professionals often struggle to monetize their time directly through their identity layer. Most scheduling tools exist outside of the Web3 ecosystem and require repeated wallet connections, breaking the user journey.

**LuksoCAL solves this** by:

- Embedding directly within the Universal Profile, making it natively discoverable and instantly usable.
    
- Eliminating the need for wallet modals through the UP Provider, significantly improving UX.
    
- Adding monetization infrastructure directly into the LUKSO profile layer.
    

---

## **How It Works**

1. A user visits the LuksoCAL app and connects their Universal Profile to generate a personalized Grid embed link.
    
2. This link is embedded into their Universal Profile Grid.
    
3. When another user views their profile, the LuksoCAL mini app detects the host context via the UP Provider.
    
4. The viewer can see available calendar slots, pick one, and pay to book using the on-chain payment flow.
    
5. Once payment is confirmed, both parties receive a calendar invite, and the booking is recorded with transparent on-chain metadata.
    

---

## **Technical Architecture**

- **Frontend**: Next.js-based app built for embedding as a mini dApp in the LUKSO Grid.
    
- **Calendar API**: Integrated with [Cal.com](https://cal.com) for real-time slot availability and event creation.
    
- **Blockchain Layer**: Smart contracts deployed on the LUKSO blockchain to manage booking payments.
    
- **Connection Layer**: Uses the UP Provider to connect seamlessly to the host Universal Profile and execute context-aware interactions.
    

_An architectural diagram will be included in the GitHub repository to illustrate how frontend, APIs, the UP Provider, and smart contracts interact._

---

## **Differentiation & Unique Value**

- **Native to LUKSO**: First booking dApp designed to run entirely within the Universal Profile Grid.
    
- **No Wallet Pain**: Uses UP Provider for instant, context-aware access—no repetitive wallet connects.
    
- **Embedded Identity**: Bookings are tied to a user’s digital identity, increasing trust and accountability.
    
- **Composable & Extensible**: Can be layered with token-gated access, time-based NFT badges, or smart contract-based services in the future.
    

---

## **User Adoption Strategy**

- Launch with early creators and consultants in the LUKSO community.
    
- Conduct an onboarding campaign targeting 100 Universal Profile holders to embed LuksoCAL in their Grid.
    
- Share educational reels, onboarding docs, and "How to Monetize Your Time" use cases.
    
- Feature LuksoCAL-enabled profiles on X (Twitter) and LUKSO’s Discord server.
    
- Create a feedback loop via open GitHub issues and Discord polls for community-led enhancements.
    

---

## **Sustainability & Long-Term Support**

- Open-source the entire project with active documentation and a public roadmap.
    
- Encourage third-party developers to fork/customize LuksoCAL for niche scheduling needs.
    
- Provide periodic compatibility updates with UP Provider and Universal Profile standards.
    
- Build an optional dashboard for LuksoCAL Pro users to view booking stats, earnings, and trends.
    

---

## **Future Roadmap**

- **Token-Gated Sessions**: Only allow bookings if the viewer holds specific tokens or NFTs.
    
- **Multi-Person Calendars**: Enable team-based scheduling and shared calendars.
    
- **On-Chain Proof of Meet**: Generate NFTs or verifiable credentials after each booking.
    
- **Smart Discounting**: Add logic to apply discounts based on past bookings or user tiers.
    
- **Mobile Optimization**: Enhance mini dApp responsiveness for mobile Grid browsers.


