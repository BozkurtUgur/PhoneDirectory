import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { MatSelectChange } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { PersonalRequest } from "app/shared/models/PersonalRequest";
import { Department } from "app/shared/models/department.model";
import { DepartmentSection } from "app/shared/models/departmentSection.model";
import { Personal } from "app/shared/models/personal.model";
import { DepartmentService } from "app/shared/services/department.service";
import { PersonalService } from "app/shared/services/personal.service";
import { MatDialog } from "@angular/material/dialog";
import { AppComfirmComponent } from "app/shared/services/app-confirm/app-confirm.component";

@Component({
  selector: "app-view-personal",
  templateUrl: "./view-personal.component.html",
  styleUrls: ["./view-personal.component.scss"],
})
export class ViewPersonalComponent implements OnInit {
  formData = {};
  console = console;
  personalForm: FormGroup;
  loading: boolean = false;
  personalId: string | null | undefined;
  personal: Personal = {
    id: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    mobile: 0,
    ext: "",
    order:0,
    title: "",
    profileImageUrl: "",
    departmentId: "",
    department: {
      id: "",
      name: "",
      description: "",
      fax: "",
      addressId: "",
      address: {
        id: "",
        physicalAdress: "",
        floor: 0,
      },
    },
    sectionId: "",



  };
  deparmentList: Department[] = [];
  sectionList: DepartmentSection[] = [];
  sectionListByDepartment: DepartmentSection[] = [];
  isNewPersonal = false;
  header = "";
  displayProfileImageUrl = "";
  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private personalService: PersonalService,
    private departmentService: DepartmentService,
    private readonly route: ActivatedRoute,
    private router: Router
  ) { }

  openDeleteConfirmationDialog(): void {
    const dialogRef = this.dialog.open(AppComfirmComponent, {
      width: '400px',
      data: {
        title: 'Uyarı!',
        message: 'Personel kaydını silmek istediğinize emin misiniz?',
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
    this.loadDepartments();
    this.loadSections();
    this.route.paramMap.subscribe((params) => {
      this.personalId = params.get("id");
      debugger;
      //studentId add ise eklemeye göre
      if (this.personalId === "add") {
        this.isNewPersonal = true;
        this.header = "Personel Ekle";
        this.initForm(null);
        this.setImage();
      } else {
        this.isNewPersonal = false;
        this.header = "Personel Düzenle";
        this.personalService.getPersonal(this.personalId).subscribe(
          (success) => {
            this.personal = success;
            this.initForm(this.personal);
            this.setImage();
          },
          (error) => {
            this.setImage();
          }
        );
      }
    });
  }
  initForm(personal: Personal) {
    this.personalForm = this.fb.group({
      id: [personal?.id || null],
      firstname: [personal?.firstName || "", Validators.required],
      lastname: [personal?.lastName || "", Validators.required],
      email: [personal?.email || "", [Validators.required, Validators.email]],
      dateOfBirth: [personal?.dateOfBirth || null],
      mobile: [personal?.mobile || null],
      ext: [personal?.ext || "", Validators.required],
      title: [personal?.title || ""],
      section: [personal?.sectionId || null],

      order: [personal?.order || null , Validators.required],

     

      department: [personal?.departmentId || null],
    });

    // Eğer personal nesnesi varsa ve sectionId doluysa, bu sectionId'ye karşılık gelen section'ı seçili hale getir
    if (personal && personal.sectionId) {

      this.sectionListByDepartment = this.sectionList.filter(section => section.departmentId === personal.departmentId);
      this.personalForm.get('section').setValue(personal.sectionId);
      this.sectionListByDepartment.unshift(null);
    } else {
      this.sectionListByDepartment = this.sectionList.filter(section => section.departmentId === personal.departmentId);
      this.sectionListByDepartment.unshift(null);
    }

    // department değişikliğinde sectionListByDepartment'in güncellenmesi için bir listener ekleyin
      this.personalForm.get('department')?.valueChanges.subscribe(selectedDepartmentId => {
      this.sectionListByDepartment = this.sectionList.filter(section => section.departmentId === selectedDepartmentId);
      this.sectionListByDepartment.unshift(null);
    });

  }
  loadDepartments() {
    this.departmentService.allDepartments().subscribe(
      (success) => {

        this.deparmentList = success;
      },
      (error) => {
        console.error("Error occurred:", error);
      }
    );
  }

  loadSections() {
    this.departmentService.allSections().subscribe(
      (success) => {

        this.sectionList = success;
      },
      (error) => {
        console.error("Error occurred:", error);
      }
    );
  }

  onDepartmentChange(event: MatSelectChange) {
    const selectedDepartmentId = event.value;
    this.sectionListByDepartment = this.sectionList.filter(section => section.departmentId === selectedDepartmentId);
    this.sectionListByDepartment.unshift(null);
  }

  onUpdate() {
    this.console.log("updategirdi");

    const controls = this.personalForm.controls;
    const personalRequest: PersonalRequest = {
      firstName: controls["firstname"].value,
      lastName: controls["lastname"].value,
      dateOfBirth: controls["dateOfBirth"].value,
      email: controls["email"].value,
      mobile: controls["mobile"].value,
      departmentId: controls["department"].value,
      ext: controls["ext"].value,
      title: controls["title"].value,
      order: controls["order"].value,
      sectionId: controls["section"].value,
    }

    this.personalService
      .updatePersonal(this.personal.id, personalRequest)
      .subscribe(
        (success) => {
          this.snackbar.open(
            "Personel başarılı bir şekilde güncellendi!",
            undefined,
            {
              duration: 2000,
            }
          );
          this.router.navigateByUrl("admin/personals");
        },
        (error) => {
          this.snackbar.open("Personel güncellenemedi!", undefined, {
            duration: 2000,
          });
        }
      );
  }

  onDelete() {
    
    this.console.log("deletegirdi");
    debugger;
    this.personalService
      .deletePersonal(this.personalId)
      .subscribe(
        (success) => {
          this.snackbar.open(
            "Personel başarılı bir şekilde silindi!",
            undefined,
            {
              duration: 2000,
            }
          );
          setTimeout(() => {
            this.router.navigateByUrl('admin/personals');
          }, 2000)
        },
        (error) => {
          this.snackbar.open("Personel silinemedi!", undefined, {
            duration: 2000,
          });
        }
      );
    
  }

  onAdd() {
    this.console.log("addgirdi");

    const controls = this.personalForm.controls;
    const personalRequest: PersonalRequest = {
      firstName: controls["firstname"].value,
      lastName: controls["lastname"].value,
      dateOfBirth: controls["dateOfBirth"].value,
      email: controls["email"].value,
      mobile: controls["mobile"].value,
      departmentId: controls["department"].value,
      ext: controls["ext"].value,
      title: controls["title"].value,
      order: controls["order"].value,
      sectionId: controls["section"].value,
    }

    this.personalService.addPersonal(personalRequest)
      .subscribe(
        (success) => {
          this.snackbar.open('Personel başarılı bir şekilde eklendi!', undefined, {
            duration: 2000
          })
          setTimeout(() => {
            this.router.navigateByUrl(`admin/personals/${success.id}`);
          }, 2000)

        },
        // (error) => {
        //   this.snackbar.open('Personel eklenemedi!', undefined, {
        //     duration: 2000
        //   })

        // }
        (errorReponse) => {
          const errorMessage = errorReponse.error;

          this.snackbar.open(errorMessage, undefined ,{
            duration:2000
          });
        }
      )
  }
  setImage() {
    debugger
    if (this.personal.profileImageUrl) {
      this.displayProfileImageUrl = this.personalService.getImagePath(
        this.personal.profileImageUrl
      );
    } else {
      this.displayProfileImageUrl = "/assets/images/avatars/001-man.svg";
    }
  }
  uploadImage(event: any) {

    if (this.personalId) {
      const file: File = event.target.files[0];
      this.personalService.uploadImage(this.personal.id, file).subscribe(
        (success) => {

          this.personal.profileImageUrl = success;
          this.setImage();

          this.snackbar.open('Personel resmi güncellendi!', undefined, {
            duration: 2000
          })
        },
        (error) => {

        },
      )
    }
  }
}
