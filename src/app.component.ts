import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pet, VetClinic, MedicalRecord, RecordType } from './models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NgOptimizedImage]
})
export class AppComponent {
  // --- STATE SIGNALS ---

  // Pet Data
  pets = signal<Pet[]>([
    { id: 1, name: 'Buddy', breed: 'Golden Retriever', dob: '2022-01-15', photoUrl: 'https://picsum.photos/seed/buddy/400/400' },
    { id: 2, name: 'Lucy', breed: 'Gato Siamés', dob: '2021-05-20', photoUrl: 'https://picsum.photos/seed/lucy/400/400' }
  ]);
  selectedPetId = signal<number>(1);

  // Vet Clinic Data
  vetClinic = signal<VetClinic>({
    name: 'Clínica Veterinaria Amigos Fieles',
    hours: 'Lunes a Viernes, 9am - 6pm',
    phone: '555-123-4567'
  });

  // Medical Records Data
  medicalRecords = signal<MedicalRecord[]>([
    // Buddy's records
    { id: 1, petId: 1, type: 'Vacuna', date: '2022-03-20', doctor: 'Dr. Smith', notes: 'Vacuna contra la rabia', nextDueDate: '2023-03-20' },
    { id: 9, petId: 1, type: 'Vacuna', date: '2023-03-20', doctor: 'Dr. Smith', notes: 'Refuerzo Rabia', nextDueDate: this.getFutureDate(365) },
    { id: 2, petId: 1, type: 'Control', date: '2023-09-10', doctor: 'Dr. Smith', notes: 'Chequeo anual, todo en orden.' },
    { id: 3, petId: 1, type: 'Medicación', date: '2023-11-05', doctor: 'Dr. Jones', notes: 'Antibióticos por 7 días.' },
    { id: 4, petId: 1, type: 'Próximo Control', date: this.getFutureDate(30), time: '10:30', doctor: 'Dr. Smith', notes: 'Control de seguimiento anual.' },
    // Lucy's records
    { id: 5, petId: 2, type: 'Vacuna', date: '2021-07-15', doctor: 'Dr. Davis', notes: 'Primera ronda de vacunas.', nextDueDate: '2022-07-15' },
    { id: 6, petId: 2, type: 'Control', date: '2023-12-01', doctor: 'Dr. Davis', notes: 'Revisión dental.' },
    { id: 7, petId: 2, type: 'Próximo Control', date: this.getFutureDate(60), time: '15:00', doctor: 'Dr. Davis', notes: 'Vacuna de refuerzo anual.' },
    { id: 8, petId: 2, type: 'Vacuna', date: '2022-07-15', doctor: 'Dr. Davis', notes: 'Vacuna Leucemia Felina', nextDueDate: '2023-07-15' },
  ]);

  // Modal State for Medical Records
  showRecordModal = signal(false);
  editingRecordId = signal<number | null>(null);
  newRecord = signal<Omit<MedicalRecord, 'id' | 'petId'>>({
    type: 'Control',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    doctor: '',
    notes: '',
    nextDueDate: this.getFutureDate(365)
  });
  recordTypes: RecordType[] = ['Control', 'Vacuna', 'Medicación', 'Próximo Control'];

  // Modal State for Pets
  showPetModal = signal(false);
  editingPetId = signal<number | null>(null);
  petFormModel = signal<Omit<Pet, 'id'>>({ name: '', breed: '', dob: '', photoUrl: '' });

  // Filter State
  filterType = signal<RecordType | null>(null);
  filterStartDate = signal('');
  filterEndDate = signal('');


  // --- COMPUTED SIGNALS ---

  selectedPet = computed(() => this.pets().find(p => p.id === this.selectedPetId()));

  petAge = computed(() => {
    const pet = this.selectedPet();
    if (!pet) return 0;
    const birthDate = new Date(pet.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  });

  // Filter records for the selected pet and sort them
  selectedPetSortedRecords = computed(() => {
    const pet = this.selectedPet();
    if (!pet) return [];
    return this.medicalRecords()
      .filter(r => r.petId === pet.id)
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  
  upcomingControls = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day to include today's appointments
    return this.selectedPetSortedRecords().filter(r => r.type === 'Próximo Control' && new Date(r.date) >= today);
  });
  
  vaccinationSchedule = computed(() => {
    return this.selectedPetSortedRecords().filter(r => r.type === 'Vacuna');
  });

  pastRecords = computed(() => {
    let records = this.selectedPetSortedRecords().filter(r => r.type !== 'Próximo Control');
    
    // Apply type filter
    if (this.filterType()) {
      records = records.filter(r => r.type === this.filterType());
    }

    // Apply date range filter
    const startDate = this.filterStartDate() ? new Date(this.filterStartDate()) : null;
    const endDate = this.filterEndDate() ? new Date(this.filterEndDate()) : null;

    if (startDate) {
        startDate.setHours(0, 0, 0, 0);
        records = records.filter(r => new Date(r.date) >= startDate);
    }
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        records = records.filter(r => new Date(r.date) <= endDate);
    }

    return records;
  });

  // --- METHODS ---

  selectPet(event: Event) {
    const petId = (event.target as HTMLSelectElement).value;
    this.selectedPetId.set(Number(petId));
  }
  
  // Filter Methods
  setFilterType(type: RecordType | null) {
      this.filterType.set(this.filterType() === type ? null : type);
  }

  clearFilters() {
      this.filterType.set(null);
      this.filterStartDate.set('');
      this.filterEndDate.set('');
  }

  // Medical Record Modal
  openAddRecordModal() {
    this.editingRecordId.set(null);
    this.newRecord.set({
      type: 'Control',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      doctor: '',
      notes: '',
      nextDueDate: this.getFutureDate(365)
    });
    this.showRecordModal.set(true);
  }

  openEditRecordModal(record: MedicalRecord) {
    this.editingRecordId.set(record.id);
    this.newRecord.set({
      type: record.type,
      date: record.date,
      time: record.time || '09:00',
      doctor: record.doctor,
      notes: record.notes,
      nextDueDate: record.nextDueDate || this.getFutureDate(365)
    });
    this.showRecordModal.set(true);
  }

  saveRecord() {
    const recordData = this.newRecord();
    const petId = this.selectedPetId();
    if (!recordData.notes || !recordData.doctor || !recordData.date) {
      alert('Por favor completa todos los campos.');
      return;
    }
    
    const editingId = this.editingRecordId();
    // Clean up data before saving
    const dataToSave: Partial<MedicalRecord> = { ...recordData };
    if (dataToSave.type !== 'Próximo Control') delete dataToSave.time;
    if (dataToSave.type !== 'Vacuna') delete dataToSave.nextDueDate;

    if (editingId !== null) {
      // Edit mode
      this.medicalRecords.update(records => 
        records.map(r => r.id === editingId ? { ...r, ...dataToSave } : r)
      );
    } else {
      // Add mode
      this.medicalRecords.update(records => [
        ...records, 
        { ...dataToSave, id: Date.now(), petId: petId } as MedicalRecord
      ]);
    }
    this.showRecordModal.set(false);
  }

  // Pet Modal
  openAddPetModal() {
    this.editingPetId.set(null);
    this.petFormModel.set({
        name: '',
        breed: '',
        dob: new Date().toISOString().split('T')[0],
        photoUrl: `https://picsum.photos/seed/${Date.now()}/400/400`
    });
    this.showPetModal.set(true);
  }

  openEditPetModal() {
    const pet = this.selectedPet();
    if (!pet) return;
    this.editingPetId.set(pet.id);
    this.petFormModel.set({
        name: pet.name,
        breed: pet.breed,
        dob: pet.dob,
        photoUrl: pet.photoUrl
    });
    this.showPetModal.set(true);
  }

  savePet() {
    const petData = this.petFormModel();
    if (!petData.name || !petData.breed || !petData.dob) {
        alert('Por favor completa nombre, raza y fecha de nacimiento.');
        return;
    }

    const editingId = this.editingPetId();
    if (editingId !== null) {
        this.pets.update(pets => pets.map(p => p.id === editingId ? { ...p, ...petData } : p));
    } else {
        const newPetId = Date.now();
        this.pets.update(pets => [...pets, { ...petData, id: newPetId }]);
        this.selectedPetId.set(newPetId);
    }
    this.showPetModal.set(false);
  }

  deletePet() {
    const petIdToDelete = this.editingPetId();
    if (petIdToDelete === null) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar a ${this.selectedPet()?.name}? Esta acción no se puede deshacer.`)) {
        this.pets.update(pets => pets.filter(p => p.id !== petIdToDelete));
        this.medicalRecords.update(records => records.filter(r => r.petId !== petIdToDelete));
        
        // Select the first pet in the list if the deleted one was selected
        if (this.selectedPetId() === petIdToDelete) {
          this.selectedPetId.set(this.pets()[0]?.id ?? null);
        }

        this.showPetModal.set(false);
    }
  }

  getRecordTypeClass(type: RecordType): string {
    switch(type) {
      case 'Control': return 'bg-blue-100 text-blue-800';
      case 'Vacuna': return 'bg-green-100 text-green-800';
      case 'Medicación': return 'bg-yellow-100 text-yellow-800';
      case 'Próximo Control': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  private getFutureDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}