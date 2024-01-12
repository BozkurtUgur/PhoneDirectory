import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { AddressRequest } from "app/shared/models/AddressRequest";
import { Address } from "app/shared/models/address.model";
import { AddressService } from "app/shared/services/address.service";
import { MatDialog } from "@angular/material/dialog";
import { AppComfirmComponent } from "app/shared/services/app-confirm/app-confirm.component";

@Component({
  selector: "app-view-address",
  templateUrl: "./view-address.component.html",
  styleUrls: ["./view-address.component.scss"],
})
export class ViewAddressComponent implements OnInit {
  formData = {};
  console = console;
  addressForm: FormGroup;
  loading: boolean = false;
  addressId: string | null | undefined;
  address: Address = {
    id: "",
    physicalAdress: "",
    floor: 0,
    order: 0,
    }
  
  
  addressList: Address[] = [];
  isNewAddress = false;
  header = "";
  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private addressService: AddressService,
    private readonly route: ActivatedRoute,
    private router: Router
  ) {}

  openDeleteConfirmationDialog(): void {
    const dialogRef = this.dialog.open(AppComfirmComponent, {
      width: '400px',
      data: {
        title: 'Uyarı!',
        message: 'Adres kaydını silmek istediğinize emin misiniz?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onDelete();
        console.log('Item deleted!');
      } else {
        console.log('Deletion canceled.');
      }
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.loadAddresses();
    this.route.paramMap.subscribe((params) => {
      this.addressId = params.get("id");
      
      if (this.addressId === "add") {
        this.isNewAddress = true;
        this.header = "Kat Ekle";
        this.initForm(null);
      } else {
        this.isNewAddress = false;
        this.header = "Kat Düzenle";
        this.addressService.getAddress(this.addressId).subscribe(
          (success) => {
            debugger;
            this.address = success;
            this.initForm(this.address);
          },
          (error) => {
          }
        );
      }
    });
  }

  initForm(address: Address) {
    this.addressForm = this.fb.group({
      id: [address?.id || null],
      physicalAdress: [address?.physicalAdress || "", Validators.required],
      order: [address?.order || "", Validators.required],
      floor: [address?.floor || "", Validators.required],
    });
  }

  loadAddresses() {
    this.addressService.allAddresses().subscribe(
      (success) => {
        this.addressList = success;
      },
      (error) => {
        console.error("Error occurred:", error);
      }
    );
  }

  addSection() {
    const newSectionName  = this.addressForm.value.section;
  
    // Eğer yeni bölüm daha önce eklenmemişse, listeye ekle
    if (newSectionName && !this.addressForm.value.sectionList.some(section => section.name === newSectionName)) {
      const newSection = { name: newSectionName };
      const updatedSectionList = [...this.addressForm.value.sectionList, newSection];
      this.addressForm.patchValue({ sectionList: updatedSectionList });
    }
    // Giriş alanını temizle
    this.addressForm.patchValue({ section: '' });
  }

  removeSection(section: any) {
    const updatedSectionList = this.addressForm.value.sectionList.filter(s => s !== section);
    this.addressForm.patchValue({ sectionList: updatedSectionList });
  }
  onSectionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedSection = event.option.value;
    this.addressForm.patchValue({ section: selectedSection.name });
  }
  onUpdate() {
    const controls = this.addressForm.controls;
    const addressRequest : AddressRequest ={
      id: this.addressId,
      physicalAdress: controls["physicalAdress"].value,
      order:controls["order"].value,
      floor:controls["floor"].value,
    }
   
    this.addressService
      .updateAddress(this.address.id, addressRequest)
      .subscribe(
        (success) => {
          this.snackbar.open(
            "Müdürlük başarılı bir şekilde güncellendi!",
            undefined,
            {
              duration: 2000,
            }
          );
          this.router.navigateByUrl("admin/addresses");
        },
        (error) => {          
          const regex = /foreignkey/i; // "FK_Personal_Section_SectionId"
          if (error?.error && regex.test(error.error)) {
           this.snackbar.open("Silmeye çalıştığınız birimde, bir veya daha fazla çalışan bu birime bağlıdır.", undefined, { duration: 2000 });
          } else {
            this.snackbar.open("Bir hata oluştu, lütfen tekrar deneyin.", undefined, { duration: 2000 });
          }
        }
      );
  }

  onDelete()
  {
    this.addressService.deleteAddress(this.address.id).subscribe(
      (success) => {
        this.snackbar.open('Müdürlük başarılı bir şekilde silindi!',undefined,{
          duration: 2000
        })

        setTimeout(()=>{
          this.router.navigateByUrl('admin/addresses');
        },2000)

      },
      (error) => {
        this.console.log(error?.error);
        const regex = /foreignKeyInPersonal/i;         
        if (error?.error && regex.test(error.error)) {
          this.snackbar.open("Silmeye çalıştığınız kat, bir veya daha fazla çalışan bu müdürlüğe bağlıdır.", undefined, { duration: 2000 });
         } else {
           this.snackbar.open("Bir hata oluştu, lütfen tekrar deneyin.", undefined, { duration: 2000 });
         }
      }
    )
  }

  onAdd() {
    debugger;
    const controls = this.addressForm.controls;
    const addressRequest : AddressRequest ={
      //id: this.addressId,
      physicalAdress: controls["physicalAdress"].value,
      order: controls["order"].value,
      floor: controls["floor"].value,
    }
   
    this.addressService.addAddress(addressRequest)
    .subscribe(
      (success) =>{
           this.snackbar.open('Kat başarılı bir şekilde eklendi!',undefined,{
             duration: 2000
           })
           setTimeout(()=>{
            this.router.navigateByUrl(`admin/addresses/${success.id}`);
          },2000)

      },
      (error) =>{
        
        this.console.log(error?.error);
        const regex = /errorSameAdress/i;         
        if (error?.error && regex.test(error.error)) {
          this.snackbar.open("Eklemeye çalıştığınız adres, kat ve sıra aynı olmamalıdır.", undefined, { duration: 2000 });
         } else {
          this.snackbar.open('Kat eklenemedi!',undefined,{
            duration: 2000
          })
 
           
         }
       
     }
    )
  }

}
