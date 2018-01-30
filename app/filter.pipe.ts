import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'paletteSearch',
    pure: false
})

export class FilterPipe implements PipeTransform {
    transform(items: any[], args: any): any {
		let groups : any = [];
		if(args.filterKey != undefined && args.filterKey != "" && args.filterKey.trim() != ""){
			if(args.isKpi){
				items.forEach((gr, index) => {
					if(gr.kpiName != undefined){
					}
				});	
			}
			else{	
				items.forEach((gr, index) => {
					let levels : any = [];;
					if(gr.groupName != undefined){
						gr.levels.forEach((level, levelIndex) => {
							if(level.name != undefined && level.name.toLowerCase().indexOf(args.filterKey.toLowerCase()) > -1){
								levels.push(level);
							}
						});
					}
					if(levels.length > 0){
						let group = Object.assign({}, gr);
						group.levels = levels;
						groups.push(groups);
					}
				});
				return groups;
			}	
		}
		/*if(args != undefined && args[0] !=  undefined && args[0] != "" && args[0].trim() != ""){
			return items.filter(item => 
				item.name.indexOf(args[0]) !== -1
			);
		}*/
		return items;
    }
}
