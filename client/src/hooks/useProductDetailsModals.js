import { useState } from 'react';

export default function useProductDetailsModals() {
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [customOrder, setCustomOrder] = useState(null);
  const [sellerContact, setSellerContact] = useState(null);

  const openPlaceOrder = () => setShowPlaceOrder(true);
  const closePlaceOrder = () => {
    setShowPlaceOrder(false);
    setCustomOrder(null);
  };

  const openMapModal = () => setShowMapModal(true);
  const closeMapModal = () => setShowMapModal(false);

  const openOfferModal = () => setShowOfferModal(true);
  const closeOfferModal = () => setShowOfferModal(false);

  const openChat = (contact) => {
    setSellerContact(contact);
    setShowChat(true);
  };
  const closeChat = () => setShowChat(false);

  const resetOfferForm = () => {
    setOfferPrice('');
    setOfferMessage('');
  };

  const createCustomOrder = (order, price, message) => {
    setCustomOrder({
      ...order,
      productPriceOffer: price,
      offerMessage: message,
    });
  };

  return {
    // Modal states
    showPlaceOrder,
    showMapModal,
    showOfferModal,
    showChat,
    
    // Form states
    offerPrice,
    setOfferPrice,
    offerMessage,
    setOfferMessage,
    customOrder,
    sellerContact,

    // Actions
    openPlaceOrder,
    closePlaceOrder,
    openMapModal,
    closeMapModal,
    openOfferModal,
    closeOfferModal,
    openChat,
    closeChat,
    resetOfferForm,
    createCustomOrder,
  };
}
