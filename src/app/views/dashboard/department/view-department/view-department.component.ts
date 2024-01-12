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
import { MatSelectChange } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { DepartmentRequest } from "app/shared/models/DepartmentRequest";
import { Address } from "app/shared/models/address.model";
import { Department } from "app/shared/models/department.model";
import { AddressService } from "app/shared/services/address.service";
import { DepartmentService } from "app/shared/services/department.service";
import { MatDialog } from "@angular/material/dialog";
import { AppComfirmComponent } from "app/shared/services/app-confirm/app-confirm.component";

@Component({
  selector: "app-view-department",
  templateUrl: "./view-department.component.html",
  styleUrls: ["./view-department.component.scss"],
})
export class ViewDepartmentComponent implements OnInit {
  formData = {};
  console = console;
  departmentForm: FormGroup;
  loading: boolean = false;
  departmentId: string | null | undefined;
  department: Department = {
    id: "",
    name: "",
    description: "",
    sectionList:[],
    order: 0,   
      addressId: "",
      address: {
        id: "",
        physicalAdress: "",
        floor: 0,
      },
    }
  
  
  addressList: Address[] = [];
  isNewDepartment = false;
  header = "";
  constructor(    
    public dialog: MatDialog,
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private deparmentService: DepartmentService,
    private addressService: AddressService,
    private readonly route: ActivatedRoute,
    private router: Router
  ) {}

  openDeleteConfirmationDialog(): void {
    const dialogRef = this.dialog.open(AppComfirmComponent, {
      width: '400px',
      data: {
        title: 'Uyarı!',
        message: 'Müdürlük kaydını silmek istediğinize emin misiniz?',
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
      this.departmentId = params.get("id");
      
      if (this.departmentId === "add") {
        this.isNewDepartment = true;
        this.header = "Müdürlük Ekle";
        this.initForm(null);
      } else {
        this.isNewDepartment = false;
        this.header = "Müdürlük Düzenle";
        this.deparmentService.getDepartment(this.departmentId).subscribe(
          (success) => {
            debugger;
            this.department = success;
            this.selectedFloor= success.address.floor;
            this.console.log( "kat:"+this.selectedFloor);
            this.initForm(this.department);
          },
          (error) => {
          }
        );
      }
    });
  }

  initForm(department: Department) {
    this.departmentForm = this.fb.group({
      id: [department?.id || null],
      name: [department?.name || "", Validators.required],
      description: [department?.description || "", Validators.required],
      order: [department?.order || "", Validators.required],
      fax: [department?.fax || null],    
      section: [''], // Bu alana kullanıcının gireceği yeni bölümleri eklemek için bir giriş alanı ekledik
      sectionList: [department?.sectionList || []],
      address: [department?.addressId || null],
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
    const newSectionName  = this.departmentForm.value.section;
  
    // Eğer yeni bölüm daha önce eklenmemişse, listeye ekle
    if (newSectionName && !this.departmentForm.value.sectionList.some(section => section.name === newSectionName)) {
      const newSection = { name: newSectionName };
      const updatedSectionList = [...this.departmentForm.value.sectionList, newSection];
      this.departmentForm.patchValue({ sectionList: updatedSectionList });
    }
    // Giriş alanını temizle
    this.departmentForm.patchValue({ section: '' });
  }

  removeSection(section: any) {
    const updatedSectionList = this.departmentForm.value.sectionList.filter(s => s !== section);
    this.departmentForm.patchValue({ sectionList: updatedSectionList });
  }
  onSectionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedSection = event.option.value;
    this.departmentForm.patchValue({ section: selectedSection.name });
  }
  onUpdate() {
    const controls = this.departmentForm.controls;
    const departmentRequest : DepartmentRequest ={
      id: this.departmentId,
      name: controls["name"].value,
      description: controls["description"].value,
      fax: controls["fax"].value,
      addressId: controls["address"].value,
      order:controls["order"].value,
      floor: this.selectedFloor,
      section:controls["sectionList"].value,
    }
   
    this.deparmentService
      .updateDepartment(this.department.id, departmentRequest)
      .subscribe(
        (success) => {
          this.snackbar.open(
            "Müdürlük başarılı bir şekilde güncellendi!",
            undefined,
            {
              duration: 2000,
            }
          );
          this.router.navigateByUrl("admin/departments");
        },
        (error) => {      
          debugger;    
          const regex = /foreignkey/i; // "FK_Personal_Section_SectionId"
          if (error?.error && regex.test(error.error)) {
           this.snackbar.open("Silmeye çalıştığınız birimde, bir veya daha fazla çalışan bu birime bağlıdır.", undefined, { duration: 2000 });
          }          
           else {
            this.snackbar.open(error?.error , undefined, { duration: 2000 });
          }
        }
      );
  }

  onDelete()
  {
    this.deparmentService.deleteDepartment(this.department.id).subscribe(
      (success) => {
        this.snackbar.open('Müdürlük başarılı bir şekilde silindi!',undefined,{
          duration: 2000
        })

        setTimeout(()=>{
          this.router.navigateByUrl('admin/departments');
        },2000)

      },
      (error) => {
        this.console.log(error?.error);
        const regex = /foreignKeyInPersonal/i;         
        if (error?.error && regex.test(error.error)) {
          this.snackbar.open("Silmeye çalıştığınız müdürlükte, bir veya daha fazla çalışan bu müdürlüğe bağlıdır.", undefined, { duration: 2000 });
         } else {
           this.snackbar.open("Bir hata oluştu, lütfen tekrar deneyin.", undefined, { duration: 2000 });
         }
      }
    )
  }

  onAddressSelectionChange(event: MatSelectChange): void {
    const selectedAddress = this.addressList.find(address => address.id === event.value);
    if (selectedAddress) {
      this.selectedFloor = selectedAddress.floor;
      console.log("floor" +this.selectedFloor );
    }
  }
   selectedFloor:number=0;
  onAdd() {
    const controls = this.departmentForm.controls;  
    const departmentRequest : DepartmentRequest ={
      name: controls["name"].value,
      description: controls["description"].value,
      fax: controls["fax"].value,
      addressId: controls["address"].value,
      floor:this.selectedFloor ,
      order:controls["order"].value,
      section:controls["sectionList"].value,
    }
   
    this.deparmentService.addDepartment(departmentRequest)
    .subscribe(
      (success) =>{
           this.snackbar.open('Müdürlük başarılı bir şekilde eklendi!',undefined,{
             duration: 2000
           })
           setTimeout(()=>{
            this.router.navigateByUrl(`admin/departments/${success.id}`);
          },2000)

      },
      (error) =>{
         this.snackbar.open('Eklemeye çalıştığınız adres, kat ve sıra aynı olmamalıdır.',undefined,{
           duration: 2000
         })

     }
    )
  }

}
