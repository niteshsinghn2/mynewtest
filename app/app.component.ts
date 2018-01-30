import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Directive, Input, Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
	constructor(public http: HttpClient) {}
	listOfSchemas: any = [{"resourceId":"branch_profitability@@client","clientName":"branch_profitability","schemaCaption":"Development - Branch Profitability","schemaName":"client"},{"resourceId":"branch_profitability@@client_us","clientName":"branch_profitability","schemaCaption":"Development US -Branch Profitability","schemaName":"client_us"},{"resourceId":"client@@client","clientName":"client","schemaCaption":"Type 2","schemaName":"client"}];
	selectedSchema: any = this.listOfSchemas[0];
	title = "Excel-Add-In";
	cubeQuery: any = "";
	json : any = {};
	inputJson = {
		"schemaCaption": "Development-Branch Profitability",
		"clientName": "",
		"schemaName": "",
		"rowTuple":[],
		"colTuple":[],
		"kpis":[],
		"grandTotalRow":false, 
		"grandTotalColumn":false,
		"pageNumber": 1,
		"pageSize": 25
	};
	onTupleDrop(event: any, type: any) {
		this.addTuple(event.dragData, type);
	}
	onKpiDrop(event: any){
		this.addKpi(event.dragData);
	}
	addTuple(dragData: any, type: any){
		if(!dragData.isKpi){
			let id = dragData.group.groupId + "~" + dragData.level.kpiId + "~" + dragData.level.attributes[0].id;
			if(this.checkIfAlreadyExists("rowTuple", id) || this.checkIfAlreadyExists("colTuple", id)){
				alert("Tuple already exists");
				return;
			}
			let tuple : any = {};
			tuple.groupType = dragData.group.groupType;
			tuple.caption = dragData.level.name;
			tuple.groupId = dragData.group.groupId;
			tuple.groupName = dragData.group.groupName;
			tuple.levelId = dragData.level.levelId;
			tuple.attributeId = dragData.level.attributes[0].id;
			tuple.id = id;
			tuple.isDynamicBucket =  dragData.level.isDynamicBucket;
			this.inputJson[type].push(tuple);
			this.makeCubeQuery();
		}
		else{
			this.addKpi(dragData);
		}
	}
	addKpi(dragData){
		if(dragData.isKpi){
			let id = dragData.group.groupId + "~" + dragData.kpi.id;
			if(this.checkIfAlreadyExists("kpis", id)){
				alert("Kpi already exists");
				return;
			}
			let kpi : any  = {};
			kpi.caption = dragData.kpi.kpiName;
			kpi.groupId = dragData.group.groupId;
			kpi.kpiId = dragData.kpi.id;
			kpi.groupName = dragData.group.groupName;
			kpi.id = id;
			kpi.kpiType = dragData.group.groupId;
			kpi.isCalcKpi = dragData.kpi.isCalcKpi;
			kpi.subtotalAggregator = [dragData.kpi.aggregator];
			this.inputJson.kpis.push(kpi);
			this.makeCubeQuery();
		}
		else{
			this.addTuple(dragData, "rowTuple");
		}
	}
	onDragOver($event, type){
		//console.log($event, type)
	}
	filterDimPalette(searchKey){
		console.log("test");
		this.json = JSON.parse(JSON.stringify(this.dimPalette));
		if(searchKey != undefined && searchKey != "" && searchKey.trim() != ""){
			let kpiGroups : any = [];
			this.json.palette.kpiGroups = [];
			this.dimPalette.palette.kpiGroups.forEach((gr, index) => {
				let kpis = [];
				if(gr.groupName != undefined){
					gr.kpi.forEach((kpi, levelIndex) => {
						if(kpi.kpiName != undefined && kpi.kpiName.toLowerCase().indexOf(searchKey.toLowerCase()) > -1){
							kpis.push(kpi);
						}
					});
				}
				if(kpis.length > 0){
					let group = JSON.parse(JSON.stringify(gr));
					group.kpi = kpis;
					this.json.palette.kpiGroups.push(group);
				}
			});
			let groups : any = [];
			this.json.palette.groups = [];
			this.dimPalette.palette.groups.forEach((gr, index) => {
				let levels : any = [];;
				if(gr.groupName != undefined){
					gr.levels.forEach((level, levelIndex) => {
						if(level.name != undefined && level.name.toLowerCase().indexOf(searchKey.toLowerCase()) > -1){
							levels.push(level);
						}
					});
				}
				if(levels.length > 0){
					let group = JSON.parse(JSON.stringify(gr));
					group.levels = levels;
					this.json.palette.groups.push(group);
				}
			});
		}
	}
	resetAll(){
		this.inputJson = {
			"schemaCaption": "Development-Branch Profitability",
			"clientName": "",
			"schemaName": "",
			"rowTuple":[],
			"colTuple":[],
			"kpis":[],
			"grandTotalRow":false, 
			"grandTotalColumn":false,
			"pageNumber": 1,
			"pageSize": 25
		};
		this.cubeQuery = "";
	}
	makeCubeQuery(){
		let query : string = "select ";
		this.inputJson.rowTuple.forEach((value, index) => {
			query += "[" + value.groupName + "].[" + value.caption + "]";
			if(this.inputJson.rowTuple.length - 1 != index){
				query += ", ";
			}
		});
		if(this.inputJson.kpis.length > 0 && this.inputJson.rowTuple.length > 0){
			query += ", ";
		}
		this.inputJson.kpis.forEach((value, index) => {
			query += "[" + value.groupName + "].[" + value.caption + "]";
			if(this.inputJson.kpis.length - 1 != index){
				query += ", ";
			}
		});
		query += " from [" + this.inputJson.schemaCaption + "]";
		this.cubeQuery =  query;
	}
	checkIfAlreadyExists(type, id){
		var alreadyExists = false;
		this.inputJson[type].forEach((value, index) =>{
			if(value.id == id){
				alreadyExists = true; 
			}
		});
		return alreadyExists;
	}
	setSelectedSchema(){
		console.log(this.selectedSchema);
		let schemaName = this.selectedSchema.schemaName;
		let clientName = this.selectedSchema.clientName;
		let headers = new HttpHeaders();
		headers = headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		let url = "https://10.10.12.80:9014/fulkrum/mvc/SliceDice/getDimensionPaletteJSON/" + clientName + "/" + schemaName;
		this.http.get(url).subscribe(data => {
			// Read the result field from the JSON response.
			this.listOfSchemas = data['results'];
			console.log(data['results']);
		});
	//	"select [Branch][Zone] from [Development-Branch Profitability]";
	}
	removeElem(index: number, type: string){
		this.inputJson[type].splice(index, 1);
	}
	public ngOnInit() {
		let headers = new HttpHeaders();
		headers = headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		this.http.post('https://10.10.12.80:9014/fulkrum/mvc/SliceDice/getLogicalInfo', "", {
			headers: headers,
		}).subscribe(data => {
			// Read the result field from the JSON response.
			this.listOfSchemas = data['results'];
			this.selectedSchema = this.listOfSchemas[0];

			console.log(data['results']);
		});
		this.json = JSON.parse(JSON.stringify(this.dimPalette));
	}
	 
	dimPalette = {"status":true,"palette":{"clientName":"branch_profitability","schemaName":"client","schemaCaption":"Development-Branch Profitability","groups":[{"groupName":"Branch","groupId":"1","groupType":"geography","levels":[{"levelId":"l1","name":"Zone","depth":"1","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l1","name":"Zone","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false},{"levelId":"l2","name":"State","depth":"2","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l2","name":"State","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false},{"levelId":"l3","name":"City","depth":"3","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l3","name":"City","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false},{"levelId":"l4","name":"Location","depth":"4","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l4","name":"Location","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false},{"levelId":"l5","name":"Branch","depth":"5","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l5","name":"Branch","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false}],"visible":true,"isDynamicBucket":false,"groupHierarchy":true},{"groupName":"Branch Status","groupId":"7","groupType":"standard","levels":[{"levelId":"l1","name":"Branch Status","depth":"1","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l1","name":"Branch Status","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false}],"visible":true,"isDynamicBucket":false,"groupHierarchy":false},{"groupName":"Branch Type","groupId":"2","groupType":"standard","levels":[{"levelId":"l1","name":"Branch Type","depth":"1","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l1","name":"Branch Type","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false}],"visible":true,"isDynamicBucket":false,"groupHierarchy":false},{"groupName":"Employee Cost to Brokerage Bucket","groupId":"6","groupType":"standard","levels":[{"levelId":"l1","name":"Employee Cost to Brokerage Bucket","depth":"1","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l1","name":"Employee Cost to Brokerage Bucket","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false}],"visible":true,"isDynamicBucket":false,"groupHierarchy":false},{"groupName":"Fiscal Calendar","groupId":"8","groupType":"time","levels":[{"levelId":"l1","name":"Fiscal Year","depth":"1","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l1","name":"Fiscal Year","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":true},{"levelId":"l2","name":"Fiscal Quarter","depth":"2","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l2","name":"Fiscal Quarter","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":true},{"levelId":"l3","name":"Fiscal Month","depth":"3","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l3","name":"Fiscal Month","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":true},{"levelId":"l4","name":"Fiscal Day","depth":"4","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l4","name":"Fiscal Day","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":true}],"visible":true,"isDynamicBucket":false,"groupHierarchy":false},{"groupName":"Multiple Range","groupId":"3","groupType":"standard","levels":[{"levelId":"l1","name":"Multiple Range","depth":"1","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l1","name":"Multiple Range","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false}],"visible":true,"isDynamicBucket":false,"groupHierarchy":false},{"groupName":"Rent to Brokerage Bucket","groupId":"4","groupType":"standard","levels":[{"levelId":"l1","name":"Rent to Brokerage Bucket","depth":"1","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l1","name":"Rent to Brokerage Bucket","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false}],"visible":true,"isDynamicBucket":false,"groupHierarchy":false},{"groupName":"Total Cost to Brokerage Bucket","groupId":"5","groupType":"standard","levels":[{"levelId":"l1","name":"Total Cost to Brokerage Bucket","depth":"1","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"l1","name":"Total Cost to Brokerage Bucket","isKey":"Y","description":null,"visible":true,"mappedToPhysical":true,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false}],"visible":true,"isDynamicBucket":false,"groupHierarchy":false},{"groupName":"test","groupId":"test","groupType":"standard","levels":[{"levelId":"test1","name":"test1","depth":"1","visible":true,"isCalcLevel":false,"expression":null,"attributes":[{"id":"test1","name":"test1","isKey":"Y","description":null,"visible":true,"mappedToPhysical":false,"hasRelation":true}],"levelType":"","bucket":null,"hasPrimaryKey":false}],"visible":true,"isDynamicBucket":false,"groupHierarchy":false}],"kpiGroups":[{"groupId":"1","groupName":"Measures","kpi":[{"kpiName":"# of Employees","id":"17","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Total number of Employees","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"# of MT","id":"18","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Number of MT","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"# of branches","id":"29","aggregator":"COUNTDISTINCT","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Total number of branches","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"% Sequential variance in Brokerage","id":"47","aggregator":null,"dataFormat":{"uiStyle":null,"format":"0.00%","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Percentage Sequential variance in Brokerage","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"% Sequential variance in profit","id":"49","aggregator":null,"dataFormat":{"uiStyle":null,"format":"0.00%","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Percentage Sequential variance in profit","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Brokerage","id":"24","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"#,###.00","currency":null,"currencyUnit":null,"currencyColumn":"MOTOPLAY__NEW_FACT_BRANCH_PL_CURRENCY_TYPE","dateColumn":"MOTOPLAY__NEW_FACT_BRANCH_PL_DATE_SK","dateDataType":null,"baseCurrency":"GBP"},"mappedToPhysical":true,"description":"Total Brokerage","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Brokerage per Employee","id":"37","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Average Brokerage per Employee","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Cluster Head Count","id":"27","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Cluster Head Count","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Cluster Head Emp Cost","id":"31","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":"AED"},"mappedToPhysical":true,"description":"Cluster Head emp cost","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"EOP Employee","id":"40","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"No of Employee at end of period","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"EOP Profit","id":"41","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Total Profit at end of period","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Including CHEC","id":"21","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"#,###.00","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":"EGP"},"mappedToPhysical":true,"description":null,"visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"MT Cost","id":"22","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"#,###.00","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":"AUD"},"mappedToPhysical":true,"description":"Total MT Cost","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Multiple","id":"25","aggregator":"AVG","dataFormat":{"uiStyle":null,"format":"#,###.00","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":null,"visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Mx Measure","id":"34","aggregator":"MAX","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":"EUR"},"mappedToPhysical":true,"description":"Max","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"No. of Transaction","id":"30","aggregator":"COUNTDISTINCT","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Total number of Transaction","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"PROFIT","id":"28","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":"MOTOPLAY__NEW_FACT_BRANCH_PL_CURRENCY_TYPE","dateColumn":"MOTOPLAY__NEW_FACT_BRANCH_PL_DATE_SK","dateDataType":null,"baseCurrency":"INR"},"mappedToPhysical":true,"description":"Total Profit","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Payroll Cost excluding cluster head","id":"20","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"#,###.00","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":"USD"},"mappedToPhysical":true,"description":"Payroll Cost excluding cluster head","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Payroll cost per Employee","id":"46","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Payroll cost per Employee","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Profit Per Employees","id":"36","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Average Profit Per Employee","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Rent","id":"23","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"#,###.00","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":"CHF"},"mappedToPhysical":true,"description":"Total Rent","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Rent per Employee","id":"45","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Average Rent per Employee","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Rent per Sqft","id":"26","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":"SGD"},"mappedToPhysical":true,"description":null,"visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Rent to Brokerage ratio","id":"43","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Giving ratio of Rent to Brokerage","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Seq  variance in Brokerage","id":"42","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Sequential  variance in Brokerage","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Seq variance in profit","id":"48","aggregator":null,"dataFormat":{"uiStyle":null,"format":"0.00%","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Sequential Variance in profit","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Total # Alert Employees(asasv)","id":"35","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Total Number of Employees","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Total Cost incl rent","id":"33","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":"CAD"},"mappedToPhysical":true,"description":"Total Cost including rent","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Total Cost to Brokerage ratio","id":"38","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Giving ratio of Total Cost to Brokerage","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Total Employee Cost","id":"32","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":"USD"},"mappedToPhysical":true,"description":"Total Employee cost","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Total Employee Cost to Brokerage ratio","id":"44","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Giving ratio of Total Cost to Brokerage","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"Total Employees","id":"19","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"Total Employees","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"test","id":"test","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"test","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"test1","id":"test1","aggregator":null,"dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"test1","visible":true,"kpiType":"expression","isCalcKpi":true,"isDynamicBucket":false,"timeGroupRequired":false},{"kpiName":"test2","id":"test2","aggregator":"SUM","dataFormat":{"uiStyle":null,"format":"##,##,###","currency":null,"currencyUnit":null,"currencyColumn":null,"dateColumn":null,"dateDataType":null,"baseCurrency":null},"mappedToPhysical":true,"description":"test2","visible":true,"kpiType":"","isCalcKpi":false,"isDynamicBucket":false,"timeGroupRequired":false}]}]}};
}
