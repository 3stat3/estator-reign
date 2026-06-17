// src/components/PropertyDivider/inheritance/AssetLedger.js

export class AssetLedger {
  constructor() {
    this.transfers = [];
    this.balances = new Map();
    this.personNames = new Map();
  }
  
  addAsset(personId, amount, fromPersonId, relationship, represents = null, isConjugal = false) {
    const current = this.balances.get(personId) || 0;
    this.balances.set(personId, current + amount);
    
    this.transfers.push({
      fromPersonId,
      toPersonId: personId,
      amount,
      relationship,
      represents,
      isConjugal,
      timestamp: new Date().toISOString()
    });
  }
  
  getBalance(personId) {
    return this.balances.get(personId) || 0;
  }
  
  getInheritanceForPerson(personId) {
    return this.transfers
      .filter(t => t.toPersonId === personId && !t.isConjugal)
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  getConjugalForPerson(personId) {
    return this.transfers
      .filter(t => t.toPersonId === personId && t.isConjugal)
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  getTransfers() {
    return this.transfers;
  }
  
  getBalances() {
    return Array.from(this.balances.entries()).map(([id, amount]) => ({
      personId: id,
      total: amount
    }));
  }
  
  getTransferHistory() {
    return this.transfers;
  }
  
  setPersonName(personId, name) {
    this.personNames.set(personId, name);
  }
  
  getPersonName(personId) {
    return this.personNames.get(personId) || `Person ${personId}`;
  }
}